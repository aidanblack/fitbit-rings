function ringsSettings(props) {
    return (
        <Page>
            <Section
                title={<Text bold>Rings Settings</Text>}>
                <Select
                    label={`Temperature Unit`}
                    settingsKey="tempUnit"
                    options={[
                        { name: "Celsius" },
                        { name: "Farenheit" }
                    ]}
                />
                <Select
                    label={`Globe Style`}
                    settingsKey="globeStyle"
                    options={[
                        { name: "BlueMarble" },
                        { name: "HeatMap" }
                    ]}
                />
            </Section>
        </Page>
    );
}

registerSettingsPage(ringsSettings);