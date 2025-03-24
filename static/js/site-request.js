// site-request.js
// Purpose: Manages site request functionality for merchants and communities (e.g., merchant.html, community.html), 
// including page/email management, domain handling, and TinyMCE integration.

// Adds a page to the site request form based on type (merchant/community).
function addPage(type = 'merchant') {
    console.log('addPage - Adding page to site request - Type:', type);
    const maxPages = 5;
    let pageCount = parseInt(localStorage.getItem(`${type}PageCount`) || (type === 'merchant' ? 2 : 1));
    console.log('addPage - Current page count:', pageCount);

    if (pageCount >= maxPages) {
        console.warn('addPage - Maximum pages reached - Max:', maxPages);
        toastr.error(`Maximum of ${maxPages} pages allowed`);
        return;
    }

    pageCount++;
    console.log('addPage - Incrementing page count to:', pageCount);
    localStorage.setItem(`${type}PageCount`, pageCount);

    const container = document.getElementById('pagesContainer');
    console.log('addPage - Pages container:', container);
    if (!container) {
        console.error('addPage - Pages container not found');
        return;
    }

    const pageDiv = document.createElement('div');
    pageDiv.className = 'page-section';
    pageDiv.dataset.page = pageCount;
    const isMerchantDefault = type === 'merchant' && pageCount <= 2;
    const pageName = isMerchantDefault ? (pageCount === 1 ? 'Home' : 'Returns Policy') : '';
    pageDiv.innerHTML = `
        <label for="page${pageCount}Name">Page Name:</label>
        <input type="text" id="page${pageCount}Name" name="page${pageCount}Name" value="${pageName}" ${isMerchantDefault ? 'readonly' : ''} placeholder="e.g., ${type === 'merchant' ? 'Products' : 'Events'}">
        <br><br>
        <label for="page${pageCount}Content">${isMerchantDefault ? (pageCount === 1 ? 'Home Page' : 'Returns Policy') : 'Page'} Content:</label>
        <textarea id="page${pageCount}Content" name="page${pageCount}Content" placeholder="Describe this page"></textarea>
        <label for="page${pageCount}Images">Additional Images:</label>
        <input type="file" id="page${pageCount}Images" name="page${pageCount}Images" accept="image/*" multiple>
        ${pageCount > (type === 'merchant' ? 2 : 1) ? `<button type="button" class="remove-page-btn" data-page="${pageCount}">Remove Page</button>` : ''}
    `;
    container.appendChild(pageDiv);
    console.log('addPage - New page section added - Page number:', pageCount);

    tinymce.remove(`#page${pageCount}Content`);
    initializeTinyMCE(`#page${pageCount}Content`);
    console.log('addPage - TinyMCE initialized for new page');
    console.log('addPage - Page addition completed');
}

// Removes a page from the site request form based on type (merchant/community).
function removePage(pageNum, type = 'merchant') {
    console.log('removePage - Removing page - Page number:', pageNum, 'Type:', type);
    let pageCount = parseInt(localStorage.getItem(`${type}PageCount`) || (type === 'merchant' ? 2 : 1));
    console.log('removePage - Current page count:', pageCount);
    const minPages = type === 'merchant' ? 2 : 1;

    if (pageCount <= minPages) {
        console.warn('removePage - Cannot remove below minimum pages - Min:', minPages);
        toastr.error(`Cannot remove the last ${type === 'merchant' ? 'Home or Returns Policy' : ''} page${minPages > 1 ? 's' : ''}`);
        return;
    }

    const pageSection = document.querySelector(`.page-section[data-page="${pageNum}"]`);
    console.log('removePage - Page section to remove:', pageSection);
    if (pageSection) {
        tinymce.get(`page${pageNum}Content`)?.remove();
        console.log('removePage - Removed TinyMCE instance for page:', pageNum);
        pageSection.remove();
        pageCount--;
        localStorage.setItem(`${type}PageCount`, pageCount);
        console.log('removePage - Page removed, new page count:', pageCount);
    } else {
        console.error('removePage - Page section not found - Page number:', pageNum);
    }
    console.log('removePage - Removal completed');
}

// Adds an email to the site request form.
function addEmail(type = 'merchant') {
    console.log('addEmail - Adding email to site request - Type:', type);
    const maxEmails = 5;
    let emailCount = parseInt(localStorage.getItem(`${type}EmailCount`) || 1);
    console.log('addEmail - Current email count:', emailCount);

    if (emailCount >= maxEmails) {
        console.warn('addEmail - Maximum emails reached - Max:', maxEmails);
        toastr.error(`Maximum of ${maxEmails} email addresses allowed`);
        return;
    }

    emailCount++;
    console.log('addEmail - Incrementing email count to:', emailCount);
    localStorage.setItem(`${type}EmailCount`, emailCount);

    const container = document.getElementById('emailsContainer');
    console.log('addEmail - Emails container:', container);
    if (!container) {
        console.error('addEmail - Emails container not found');
        return;
    }

    const domain = document.getElementById('preferredDomain')?.value || (type === 'merchant' ? 'mystore.uk' : 'mycommunity.org');
    console.log('addEmail - Using domain:', domain);
    const emailDiv = document.createElement('div');
    emailDiv.className = 'email-section';
    emailDiv.dataset.email = emailCount;
    emailDiv.innerHTML = `
        <label for="email${emailCount}Name">Email Name:</label>
        <input type="text" id="email${emailCount}Name" name="email${emailCount}Name" placeholder="e.g., contact">
        <span id="email${emailCount}Domain">@${domain}</span>
        <button type="button" class="remove-email-btn" data-email="${emailCount}">Remove Email</button>
    `;
    container.appendChild(emailDiv);
    console.log('addEmail - New email section added - Email number:', emailCount);

    updateDomainPreview(type);
    console.log('addEmail - Email addition completed');
}

// Removes an email from the site request form.
function removeEmail(emailNum, type = 'merchant') {
    console.log('removeEmail - Removing email - Email number:', emailNum, 'Type:', type);
    let emailCount = parseInt(localStorage.getItem(`${type}EmailCount`) || 1);
    console.log('removeEmail - Current email count:', emailCount);

    if (emailCount <= 1) {
        console.warn('removeEmail - Cannot remove the last email');
        toastr.error('Cannot remove the last email');
        return;
    }

    const emailSection = document.querySelector(`.email-section[data-email="${emailNum}"]`);
    console.log('removeEmail - Email section to remove:', emailSection);
    if (emailSection) {
        emailSection.remove();
        emailCount--;
        localStorage.setItem(`${type}EmailCount`, emailCount);
        console.log('removeEmail - Email removed, new email count:', emailCount);
        updateDomainPreview(type);
    } else {
        console.error('removeEmail - Email section not found - Email number:', emailNum);
    }
    console.log('removeEmail - Removal completed');
}

// Updates the domain preview and email domain spans for the site request.
function updateDomainPreview(type = 'merchant') {
    console.log('updateDomainPreview - Updating domain preview - Type:', type);
    const domain = document.getElementById('preferredDomain')?.value || (type === 'merchant' ? 'mystore.uk' : 'mycommunity.org');
    console.log('updateDomainPreview - Domain value:', domain);

    const previewElement = document.getElementById('domainPreview');
    if (previewElement) {
        previewElement.textContent = `@${domain}`;
        console.log('updateDomainPreview - Updated domain preview to:', `@${domain}`);
    }

    let emailCount = parseInt(localStorage.getItem(`${type}EmailCount`) || 1);
    console.log('updateDomainPreview - Email count:', emailCount);
    for (let i = 1; i <= emailCount; i++) {
        const domainSpan = document.getElementById(`email${i}Domain`);
        console.log('updateDomainPreview - Checking domain span - ID:', `email${i}Domain`, 'Element:', domainSpan);
        if (domainSpan) {
            domainSpan.textContent = `@${domain}`;
            console.log('updateDomainPreview - Updated email domain - ID:', `email${i}Domain`, 'to:', `@${domain}`);
        }
    }
    console.log('updateDomainPreview - Update completed');
}

// Checks domain availability for the site request.
async function checkDomainAvailability() {
    console.log('checkDomainAvailability - Starting domain availability check');
    const domainInput = document.getElementById('preferredDomain');
    const domain = domainInput?.value;
    console.log('checkDomainAvailability - Domain to check:', domain);

    const domainRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    if (!domain) {
        console.warn('checkDomainAvailability - No domain provided');
        toastr.error('Please enter a preferred domain name');
        return false;
    }
    if (!domainRegex.test(domain)) {
        console.warn('checkDomainAvailability - Invalid domain format - Domain:', domain);
        toastr.error('Invalid domain name (e.g., mystore.uk)');
        return false;
    }

    console.log('checkDomainAvailability - Domain format valid, proceeding with check');
    toastr.info(`Checking availability for ${domain}...`);

    try {
        const startTime = Date.now();
        const response = await fetch(`https://clubmadeira.io/check-domain?domain=${encodeURIComponent(domain)}`, {
            method: 'GET',
            credentials: 'same-origin'
        });
        const duration = Date.now() - startTime;
        console.log('checkDomainAvailability - Fetch response received - Status:', response.status, 'Duration:', `${duration}ms`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('checkDomainAvailability - Fetch failed - Status:', response.status, 'Error text:', errorText);
            if (response.status === 403) {
                throw new Error('Permission denied - please log in');
            }
            throw new Error(`Server error: ${errorText}`);
        }

        const result = await response.json();
        console.log('checkDomainAvailability - Availability result:', JSON.stringify(result));
        if (result.available) {
            console.log('checkDomainAvailability - Domain available:', domain);
            toastr.success(`${result.domain} is available!`);
            return true;
        } else {
            console.warn('checkDomainAvailability - Domain not available:', domain);
            toastr.error(`${result.domain} is not available`);
            if (domainInput) domainInput.value = '';
            return false;
        }
    } catch (error) {
        console.error('checkDomainAvailability - Error checking domain - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Failed to check domain availability: ${error.message}`);
        return false;
    }
}

// Loads TinyMCE editor for site request content editing.
async function loadTinyMCE() {
    console.log('loadTinyMCE - Starting TinyMCE load');
    if (typeof tinymce !== 'undefined' && tinymce.init) {
        console.log('loadTinyMCE - TinyMCE already loaded');
        initializeTinyMCE();
        return;
    }

    console.log('loadTinyMCE - Loading TinyMCE script');
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.tiny.cloud/1/ml1wlwr128qsm8hn8d86e5mhs3y2fuvjr9ztknrsh23x6krp/tinymce/5/tinymce.min.js';
        script.referrerpolicy = 'origin';
        document.head.appendChild(script);
        console.log('loadTinyMCE - Script element added to head:', script.src);

        script.onload = () => {
            console.log('loadTinyMCE - TinyMCE script loaded successfully');
            initializeTinyMCE();
            resolve();
        };
        script.onerror = () => {
            console.error('loadTinyMCE - Failed to load TinyMCE script');
            toastr.error('Failed to load rich text editor');
            reject(new Error('TinyMCE load failed'));
        };
    });
}

// Initializes TinyMCE editor for site request content editing with a specific selector.
function initializeTinyMCE(selector = 'textarea[name$="Content"], #aboutStore, #aboutCommunity') {
    console.log('initializeTinyMCE - Starting TinyMCE initialization - Selector:', selector);
    if (!window.tinymce) {
        console.error('initializeTinyMCE - TinyMCE not available');
        return;
    }

    tinymce.remove(selector);
    console.log('initializeTinyMCE - Removed existing TinyMCE instances for selector:', selector);

    tinymce.init({
        selector: selector,
        height: 200,
        menubar: false,
        plugins: 'lists',
        toolbar: 'bold italic | bullist numlist',
        setup: editor => {
            editor.on('init', () => {
                console.log('initializeTinyMCE - TinyMCE editor initialized for:', editor.id);
            });
        }
    });
    console.log('initializeTinyMCE - TinyMCE initialization completed');
}

// Generates a formatted timestamp for site request forms.
function getCurrentTimestamp() {
    console.log('getCurrentTimestamp - Generating current timestamp');
    const now = new Date();
    console.log('getCurrentTimestamp - Current date object:', now);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    console.log('getCurrentTimestamp - Extracted components - Year:', year, 'Month:', month, 'Day:', day, 'Hours:', hours, 'Minutes:', minutes, 'Seconds:', seconds);
    const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    console.log('getCurrentTimestamp - Generated timestamp:', timestamp);
    return timestamp;
}

// Saves the site request form data for either a merchant store or community site.
async function saveSiteRequest(type = 'merchant') {
    console.log('saveSiteRequest - Starting site request save - Type:', type);
    const userId = document.getElementById('userId')?.value || localStorage.getItem('userId');
    console.log('saveSiteRequest - Retrieved userId:', userId);

    if (!userId) {
        console.error('saveSiteRequest - User ID not found in session or DOM');
        toastr.error('User ID not found in session');
        return;
    }

    const nameField = type === 'merchant' ? 'storeName' : 'communityName';
    const aboutField = type === 'merchant' ? 'aboutStore' : 'aboutCommunity';
    const logoField = type === 'merchant' ? 'storeLogos' : 'communityLogos';
    const defaultDomain = type === 'merchant' ? 'mystore.uk' : 'mycommunity.org';

    const siteRequest = {
        userId: userId,
        type: type,
        [nameField]: document.getElementById(nameField)?.value.trim() || '',
        [aboutField]: tinymce.get(aboutField)?.getContent() || document.getElementById(aboutField)?.value || '',
        [logoField]: [],
        colorPrefs: document.getElementById('colorPrefs')?.value.trim() || '',
        stylingDetails: document.getElementById('stylingDetails')?.value.trim() || '',
        preferredDomain: document.getElementById('preferredDomain')?.value.trim() || defaultDomain,
        emails: [],
        pages: [],
        widgets: Array.from(document.querySelectorAll('input[name="widgets"]:checked')).map(cb => cb.value)
    };
    console.log('saveSiteRequest - Initial site request object:', JSON.stringify(siteRequest));

    // Validation
    if (!siteRequest[nameField]) {
        console.warn('saveSiteRequest - Name field is empty - Field:', nameField);
        toastr.error(`${type === 'merchant' ? 'Store' : 'Community'} name is required`);
        return;
    }

    const domainRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(siteRequest.preferredDomain)) {
        console.warn('saveSiteRequest - Invalid domain format - Domain:', siteRequest.preferredDomain);
        toastr.error(`Invalid domain name (e.g., ${defaultDomain})`);
        return;
    }

    // Handle logos
    const logoFiles = document.getElementById(logoField)?.files || [];
    console.log('saveSiteRequest - Logo files count:', logoFiles.length);
    if (logoFiles.length > 5) {
        console.warn('saveSiteRequest - Too many logos - Count:', logoFiles.length);
        toastr.error('Maximum of 5 logos allowed');
        return;
    }
    for (let i = 0; i < logoFiles.length; i++) {
        const reader = new FileReader();
        await new Promise(resolve => {
            reader.onload = () => {
                siteRequest[logoField].push(reader.result);
                console.log('saveSiteRequest - Added logo - Index:', i, 'Result length:', reader.result.length);
                resolve();
            };
            reader.readAsDataURL(logoFiles[i]);
        });
    }

    // Collect emails
    let emailCount = parseInt(localStorage.getItem(`${type}EmailCount`) || 1);
    console.log('saveSiteRequest - Collecting emails - Email count:', emailCount);
    for (let i = 1; i <= emailCount; i++) {
        const emailInput = document.getElementById(`email${i}Name`);
        if (emailInput && emailInput.value.trim()) {
            siteRequest.emails.push(emailInput.value.trim());
            console.log('saveSiteRequest - Added email - Index:', i, 'Value:', emailInput.value.trim());
        }
    }

    // Collect pages
    let pageCount = parseInt(localStorage.getItem(`${type}PageCount`) || (type === 'merchant' ? 2 : 1));
    console.log('saveSiteRequest - Collecting pages - Page count:', pageCount);
    for (let i = 1; i <= pageCount; i++) {
        const nameInput = document.getElementById(`page${i}Name`);
        const contentEditor = tinymce.get(`page${i}Content`);
        const contentFallback = document.getElementById(`page${i}Content`);
        const imagesInput = document.getElementById(`page${i}Images`);
        if (nameInput && nameInput.value.trim()) {
            const page = {
                name: nameInput.value.trim(),
                content: contentEditor ? contentEditor.getContent() : (contentFallback?.value || ''),
                images: []
            };
            console.log('saveSiteRequest - Processing page - Index:', i, 'Name:', page.name);

            if (imagesInput && imagesInput.files.length > 0) {
                for (let j = 0; j < imagesInput.files.length; j++) {
                    const reader = new FileReader();
                    await new Promise(resolve => {
                        reader.onload = () => {
                            page.images.push(reader.result);
                            console.log('saveSiteRequest - Added image to page - Page:', i, 'Image index:', j, 'Result length:', reader.result.length);
                            resolve();
                        };
                        reader.readAsDataURL(imagesInput.files[j]);
                    });
                }
            }
            siteRequest.pages.push(page);
        }
    }

    const minPages = type === 'merchant' ? 2 : 1;
    if (siteRequest.pages.length < minPages || (type === 'merchant' && (!siteRequest.pages.some(p => p.name === 'Home') || !siteRequest.pages.some(p => p.name === 'Returns Policy')))) {
        console.warn('saveSiteRequest - Insufficient or missing required pages - Pages:', siteRequest.pages.length, 'Required:', minPages);
        toastr.error(type === 'merchant' ? 'Home and Returns Policy pages are required' : 'At least one page is required');
        return;
    }

    // Save to server
    try {
        console.log('saveSiteRequest - Sending site request to server - URL:', `${apiUrl}/${userId}/siterequest`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${apiUrl}/${userId}/siterequest`, {
            method: 'POST',
            body: JSON.stringify(siteRequest)
        });
        const duration = Date.now() - startTime;

        if (!response) {
            console.error('saveSiteRequest - No response from fetch');
            toastr.error('Failed to save site request: No server response');
            return;
        }
        if (!response.ok) {
            const errorText = await response.text();
            console.error('saveSiteRequest - Fetch failed - Status:', response.status, 'Error text:', errorText);
            throw new Error(`Failed to save site request: ${response.status} - ${errorText}`);
        }

        console.log('saveSiteRequest - Save successful - Duration:', `${duration}ms`);
        toastr.success(`${type === 'merchant' ? 'Store' : 'Site'} request saved successfully`);
    } catch (error) {
        console.error('saveSiteRequest - Error saving site request - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Error saving ${type === 'merchant' ? 'store' : 'site'} request: ${error.message}`);
    }
    console.log('saveSiteRequest - Save process completed');
}