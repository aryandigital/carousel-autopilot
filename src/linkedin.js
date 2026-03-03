// ============================================
// LinkedIn Publisher — API-based posting
// ============================================
// Uploads PDF carousel + caption to LinkedIn profile

const fs = require('fs');
const path = require('path');

const LINKEDIN_API = 'https://api.linkedin.com/v2';
const LINKEDIN_REST_API = 'https://api.linkedin.com/rest';

/**
 * Post a carousel PDF to LinkedIn
 * @param {string} pdfPath - Path to the carousel PDF
 * @param {string} caption - Post caption text
 * @param {string[]} hashtags - Array of hashtag strings
 * @returns {Promise<Object>} LinkedIn API response
 */
async function postToLinkedIn(pdfPath, caption, hashtags = []) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 LINKEDIN PUBLISHER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    if (!accessToken) {
        console.log('   ⚠️  No LinkedIn access token — skipping publish');
        console.log('   💡 Set LINKEDIN_ACCESS_TOKEN in .env to enable auto-posting');
        return { success: false, reason: 'No access token' };
    }

    try {
        // Step 1: Get the user's LinkedIn profile URN
        console.log('   1. Fetching profile info...');
        const profileUrn = await getProfileUrn(accessToken);

        // Step 2: Register the document upload
        console.log('   2. Registering document upload...');
        const uploadInfo = await registerDocumentUpload(accessToken, profileUrn);

        // Step 3: Upload the PDF
        console.log('   3. Uploading carousel PDF...');
        await uploadDocument(accessToken, uploadInfo.uploadUrl, pdfPath);

        // Step 4: Create the post with the document
        console.log('   4. Creating LinkedIn post...');
        const fullCaption = caption + '\n\n' + hashtags.join(' ');
        const postResult = await createPost(accessToken, profileUrn, uploadInfo.documentUrn, fullCaption);

        console.log('\n   ✅ Posted to LinkedIn!');
        console.log(`   🔗 Post ID: ${postResult.id || 'created'}`);

        return { success: true, postId: postResult.id };
    } catch (err) {
        console.error(`\n   ❌ LinkedIn posting failed: ${err.message}`);
        return { success: false, error: err.message };
    }
}

async function getProfileUrn(accessToken) {
    const res = await fetch(`${LINKEDIN_API}/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Profile fetch failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return `urn:li:person:${data.sub}`;
}

async function registerDocumentUpload(accessToken, ownerUrn) {
    const res = await fetch(`${LINKEDIN_REST_API}/documents?action=initializeUpload`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': '202501',
            'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
            initializeUploadRequest: {
                owner: ownerUrn,
            },
        }),
    });

    if (!res.ok) throw new Error(`Document register failed: ${res.status} ${await res.text()}`);
    const data = await res.json();

    return {
        uploadUrl: data.value.uploadUrl,
        documentUrn: data.value.document,
    };
}

async function uploadDocument(accessToken, uploadUrl, pdfPath) {
    const fileBuffer = fs.readFileSync(pdfPath);

    const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/pdf',
        },
        body: fileBuffer,
    });

    if (!res.ok) throw new Error(`Document upload failed: ${res.status}`);
}

async function createPost(accessToken, authorUrn, documentUrn, commentary) {
    const res = await fetch(`${LINKEDIN_REST_API}/posts`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': '202501',
            'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
            author: authorUrn,
            commentary: commentary,
            visibility: 'PUBLIC',
            distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            content: {
                media: {
                    title: 'Carousel Post',
                    id: documentUrn,
                },
            },
            lifecycleState: 'PUBLISHED',
            isReshareDisabledByAuthor: false,
        }),
    });

    if (!res.ok) throw new Error(`Post creation failed: ${res.status} ${await res.text()}`);

    const postId = res.headers.get('x-restli-id') || 'created';
    return { id: postId };
}

module.exports = { postToLinkedIn };
