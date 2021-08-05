import { peerSocket } from 'messaging'
import * as fs from "fs";
import { inbox } from 'file-transfer';
import document from "document";

class File {
    constructor() {
        peerSocket.addEventListener('message', (evt) => {
            const { destFilename, data, error } = evt.data;
            console.log(JSON.stringify(evt.data));
            if (destFilename) {
                const promise = this.promises[this.now];
                if (error) {
                    promise.reject(error);
                }
                else {
                    this.fileName = `/private/data/${destFilename}`;
                    this.timestamp = Date.now();
                    if(data == "outbox")  {
                        this.getInboxFile();
                    }
                    else {
                        this.file = data;
                        this.writeFile();
                    }
                    promise.resolve(this.file);
                    console.log(`${this.fileName} is now available`);
                }
                delete this.promises[destFilename];
            }
        });
          
        peerSocket.addEventListener('open', (evt) => {
        setTimeout(() => {
            this.requests.forEach(r => this.sendRequest(r));
            this.requests.length = 0;
        }, 500);
        });
        
        peerSocket.addEventListener('error', (err) => {
        console.log("Connection error: " + err.message);
        // I don't know what to do in this case yet... Notify every promises object ?
        });

        inbox.addEventListener("newfile", (evt: Event) => {
            console.log(JSON.stringify(evt));
            this.getInboxFile();
            this.daylight1.href = this.fileName;
        });

    }

    fileRequested = false;
    firstRun =  1;

    file = undefined;
    fileName = "";
    timestamp = 0;
    now = Date.now();

    promises = {};
    requests = [];

    daylight1 = document.getElementById("daylight1") as ImageElement;

    getInboxFile() {
        var newFileName;
        try {
            var inboxFileName;
            while (newFileName = inbox.nextFile()) {
                console.log(`/private/data/${newFileName} found in Inbox`);
                inboxFileName = newFileName;
            }
            this.fileName = `/private/data/${inboxFileName}`;
            this.file = this.readFile()
            console.log(`Image set to ${this.fileName}`);
        }
        catch(ex) {
            console.error(ex.message);
        }
    }

    getLatestFile() {
        var files = fs.listDirSync("/private/data");
        var oldFile;
        var previousFile = "";
        var currentFileName = "";
        while((oldFile = files.next()) && !oldFile.done) {
            if(previousFile) {
                try {
                    fs.unlinkSync(`/private/data/${previousFile}`);
                    console.log(`/private/data/${previousFile} deleted`);
                }
                catch (ex) { console.log(ex.message); }
            }

            previousFile = currentFileName;

            if(oldFile.value.indexOf(".jpg") > 0 || oldFile.value.indexOf(".png") > 0) {
                currentFileName = oldFile.value;
                this.fileName = `/private/data/${currentFileName}`;
            }
            console.log(`${this.fileName} found`);
        }
        this.readFile();
    }

    readFile = () => {
        try {
            this.file = fs.readFileSync(this.fileName);
        } catch (n) {
            this.file = { now : 0 };
        }
    }

    writeFile = () => {
        try {
            fs.writeFileSync(this.fileName, this.file);
        } catch (n) {
        }
    }

    sendRequest = (r) => {
        if (peerSocket.readyState === peerSocket.OPEN) {
            peerSocket.send(r);
        } else {
            this.requests.push(r);
        }
    }


    fetch = (maximumAge = 0, location) => {
        if (this.file === undefined) {
            this.readFile();
        }

        return new Promise((resolve, reject) => {
            this.now = Date.now()
            if (this.file && (this.now - this.timestamp < maximumAge)) {
                resolve(this.file);
            }
            else {
                this.promises[this.now] = { resolve, reject };
                this.sendRequest(location);
            }
        })
    }

    get = () => {
        if(this.file === undefined) {
            this.readFile();
        }
        return this.file;
    }

    requestFile() {
        try {
            console.log("Request file");
            var lat;
            var lon;

            var data = {
                key: "getDaylightImage",
                value: ""
            };
            this.fileRequested = true;
            console.log(JSON.stringify(data));

            this.getLatestFile();

            this.fetch(this.firstRun * 60 * 1000, data)
            .then(() => this.firstRun = 60)
            .catch(error => console.log(error.message));

            this.daylight1.href = this.fileName;
            console.log(`Image set to ${this.fileName}`);
        }
        catch(ex) {
            console.log(ex.message);
        }
    }
}

export default File;