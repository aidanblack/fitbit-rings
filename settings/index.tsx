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
            </Section>
        </Page>
    );
}

registerSettingsPage(ringsSettings);