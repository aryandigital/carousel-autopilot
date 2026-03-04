const accessToken = 'AQUdtBrAHtVHHtJYBloQRn3OPN5fE0GjHr_4NHeMEl2J5cqUi_4h7u-dYjB2qJvflJKVPLNXZjuArylYN2cL1LhSRzWztVVku_oZoqLttY0dvIXeg9n1TSXeBGAiLdxIUjE3EvRwBC8dmkQe08YD-WpAiWiHS73G7YKr6V5aR7XaLlp4XzXtVZJg4yWTGxtpjNhmE21go4GwJwunj-MYw9pD5R6Z4qkVGN53bXEMcXB_DLUk6yCGrq2cbdPMS0ysA05YH27AnolmVHfzpzCBmgNnnZQtMAqPqVbHAnw1uB4mcF2A1jGqHjHW73tsBO_5Y3p8rNvscRZeZk670Q1JBNnSFN3QTA';
const ownerUrn = "urn:li:person:MeHLBh4C6w";

async function testVersion(version) {
    console.log(`Testing version: ${version}...`);
    const res = await fetch('https://api.linkedin.com/rest/documents?action=initializeUpload', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': version,
            'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
            initializeUploadRequest: { owner: ownerUrn },
        }),
    });
    console.log(`Result: ${res.status} ${await res.text()}`);
}

async function run() {
    await testVersion('202506');
    await testVersion('202509');
    await testVersion('202511');
    await testVersion('202512');
    await testVersion('202601');
    await testVersion('202602');
    await testVersion('202603');
}
run();
