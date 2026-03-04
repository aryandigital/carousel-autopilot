const accessToken = 'AQUdtBrAHtVHHtJYBloQRn3OPN5fE0GjHr_4NHeMEl2J5cqUi_4h7u-dYjB2qJvflJKVPLNXZjuArylYN2cL1LhSRzWztVVku_oZoqLttY0dvIXeg9n1TSXeBGAiLdxIUjE3EvRwBC8dmkQe08YD-WpAiWiHS73G7YKr6V5aR7XaLlp4XzXtVZJg4yWTGxtpjNhmE21go4GwJwunj-MYw9pD5R6Z4qkVGN53bXEMcXB_DLUk6yCGrq2cbdPMS0ysA05YH27AnolmVHfzpzCBmgNnnZQtMAqPqVbHAnw1uB4mcF2A1jGqHjHW73tsBO_5Y3p8rNvscRZeZk670Q1JBNnSFN3QTA';

async function testToken() {
    try {
        console.log("Fetching /v2/me...");
        const resMe = await fetch('https://api.linkedin.com/v2/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log("Status /v2/me:", resMe.status);
        console.log("Body /v2/me:", await resMe.text());

        console.log("\nFetching /v2/userinfo...");
        const resUi = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log("Status /v2/userinfo:", resUi.status);
        console.log("Body /v2/userinfo:", await resUi.text());
    } catch (err) {
        console.error(err);
    }
}

testToken();
