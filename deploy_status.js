// Check deployment status
const RENDER_API_KEY = 'rnd_0iq2Pjk5QlujIRetUEkSgOLKpGIe';
const URL = 'https://api.render.com/v1/services/srv-d6j63ingi27c73f4aq80/deploys?limit=1';

async function check() {
    const res = await fetch(URL, {
        headers: {
            'Authorization': `Bearer ${RENDER_API_KEY}`,
            'Accept': 'application/json'
        }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

check();
