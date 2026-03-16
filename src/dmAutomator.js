// ============================================
// LinkedIn DM Automator
// ============================================
// Sends private messages to a rotating list of connections

const fs = require('fs');
const path = require('path');

const LINKEDIN_API = 'https://api.linkedin.com/v2';
const TARGETS_FILE = path.join(process.cwd(), 'dm_targets.json');
const HISTORY_FILE = path.join(process.cwd(), 'dm_history.json');

/**
 * Ensures the basic tracking files exist.
 */
function initFiles() {
    if (!fs.existsSync(TARGETS_FILE)) {
        fs.writeFileSync(TARGETS_FILE, JSON.stringify([
            // Add LinkedIn Profile URNs here
            // e.g. "urn:li:person:123456789"
        ], null, 2));
    }
    if (!fs.existsSync(HISTORY_FILE)) {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
    }
}

/**
 * Distribute post via DMs to a new set of people
 * @param {string} accessToken - LinkedIn Access Token
 * @param {string} senderUrn - The sender's URN
 * @param {string} postUrl - The URL of the post to share (or message content)
 * @param {number} batchSize - Number of people to message in this run
 */
async function sendDMs(accessToken, senderUrn, postUrl, batchSize = 5) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✉️  LINKEDIN DM AUTOMATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!accessToken) {
        console.log('   ⚠️  No LinkedIn access token — skipping DMs');
        return { success: false, reason: 'No access token' };
    }

    initFiles();

    // Load targets and history
    let targets = [];
    let history = [];
    try {
        targets = JSON.parse(fs.readFileSync(TARGETS_FILE, 'utf8'));
        history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (e) {
        console.error('   ❌ Failed to read DM tracking files:', e.message);
        return { success: false, error: e.message };
    }

    if (!Array.isArray(targets) || targets.length === 0) {
        console.log('   ⚠️  No targets found in dm_targets.json. Please add LinkedIn URNs.');
        return { success: false, reason: 'No targets defined' };
    }

    // Find new targets that haven't been messaged yet
    const pendingTargets = targets.filter(urn => !history.includes(urn));
    
    if (pendingTargets.length === 0) {
        console.log('   ✅ All targets have already been messaged. Resetting history or add new targets.');
        return { success: true, messaged: 0, reason: 'All targets exhausted' };
    }

    // Select this batch
    const batch = pendingTargets.slice(0, batchSize);
    console.log(`   📤 Sending DMs to ${batch.length} new people...`);

    let successCount = 0;
    
    for (const recipientUrn of batch) {
        try {
            console.log(`      ...messaging ${recipientUrn}`);
            await sendSingleDM(accessToken, recipientUrn, postUrl);
            
            // Record success
            history.push(recipientUrn);
            successCount++;
            
            // Delay slightly to prevent rate limits
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
            console.error(`      ❌ Failed to message ${recipientUrn}:`, e.message);
        }
    }

    // Save updated history
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

    console.log(`\n   ✅ Successfully sent ${successCount} DMs.`);
    return { success: true, messaged: successCount };
}

/**
 * API call to send a single message
 * NOTE: Requires 'w_member_social_messages' permission or equivalent API access
 */
async function sendSingleDM(accessToken, recipientUrn, text) {
    const url = `${LINKEDIN_API}/messages`;
    
    const body = {
        recipients: [recipientUrn],
        messageBody: {
            text: `Hi! I just published a new carousel on web dev and thought you'd find it interesting. Check it out: ${text}`
        }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            // Sometimes required for messaging endpoints depending on the LinkedIn version
            'X-Restli-Protocol-Version': '2.0.0', 
            'LinkedIn-Version': '202602'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Status ${res.status}: ${errorText}`);
    }
    
    return true;
}

module.exports = { sendDMs };
