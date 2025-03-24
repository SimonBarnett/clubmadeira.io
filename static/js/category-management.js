// category-management.js
// Purpose: Manages treeview functionality for displaying and editing nested category information (used in community.html and admin.html).

// Creates a treeview node for category display with configurable behavior.
function createTreeNode(category, level = 0, isAdmin = false, savedCategories = []) {
    console.log('createTreeNode - Creating node - Category:', JSON.stringify(category), 'Level:', level, 'IsAdmin:', isAdmin);
    const li = document.createElement('li');
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'node';

    const toggle = document.createElement('span');
    toggle.className = 'toggle';
    toggle.setAttribute('data-id', category.id);
    toggle.textContent = '+'; // Default to '+' assuming subcategories may exist
    toggle.addEventListener('click', () => toggleSubcategories(category.id, toggle));

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = category.id;
    if (isAdmin) {
        checkbox.addEventListener('change', () => handleCategorySelection(category.id, checkbox));
    } else {
        checkbox.checked = savedCategories.includes(category.id.toString());
    }

    const span = document.createElement('span');
    span.textContent = `${category.name} (${category.id})`;

    nodeDiv.appendChild(toggle);
    nodeDiv.appendChild(checkbox);
    nodeDiv.appendChild(span);
    li.appendChild(nodeDiv);

    const subUl = document.createElement('ul');
    subUl.className = 'subcategories';
    li.appendChild(subUl);

    console.log('createTreeNode - Node created - Category ID:', category.id);
    return li;
}

// Loads category data for treeview rendering, with options for admin or community context.
async function loadCategories(userId = null, isAdmin = false) {
    console.log('loadCategories - Starting category load - UserID:', userId, 'IsAdmin:', isAdmin);
    let savedCategories = [];
    try {
        console.log('loadCategories - Fetching categories via authenticatedFetch');
        const startTime = Date.now();

        // Load user's saved categories if not admin
        if (!isAdmin && userId) {
            const userResponse = await authenticatedFetch(`${window.apiUrl}/${userId}/mycategories`);
            if (!userResponse.ok) throw new Error(`Failed to fetch user categories: ${userResponse.status}`);
            const userData = await userResponse.json();
            savedCategories = userData.categories || [];
            console.log('loadCategories - Saved categories fetched - Count:', savedCategories.length);
        }

        // Load all categories
        const response = await authenticatedFetch(`${window.apiUrl}/categories`);
        if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);
        const data = await response.json();
        const duration = Date.now() - startTime;
        console.log('loadCategories - Categories fetched - Count:', data.categories?.length, 'Duration:', `${duration}ms`);

        const treeElement = document.getElementById('categoryTree');
        if (!treeElement) {
            console.error('loadCategories - Tree element not found - ID: categoryTree');
            return;
        }
        treeElement.innerHTML = '';
        const ul = document.createElement('ul');

        // Filter top-level categories for community, show all for admin
        const categoriesToRender = isAdmin ? data.categories : data.categories.filter(cat => !cat.parent_id);
        console.log('loadCategories - Categories to render - Count:', categoriesToRender.length);

        categoriesToRender.forEach(category => {
            const node = createTreeNode(category, 0, isAdmin, savedCategories);
            ul.appendChild(node);
        });
        treeElement.appendChild(ul);

        // Reattach listeners for community context
        if (!isAdmin) attachEventListeners();

        console.log('loadCategories - Treeview rendered successfully');
        toastr.success('Categories loaded successfully');
    } catch (error) {
        console.error('loadCategories - Error loading categories - Error:', error.message, 'Stack:', error.stack);
        toastr.error('Failed to load categories');
    }
    console.log('loadCategories - Category load completed');
}

// Toggles visibility of subcategories in treeview and loads them dynamically if needed.
async function toggleSubcategories(categoryId, toggle) {
    console.log('toggleSubcategories - Toggling subcategories - Category ID:', categoryId);
    const li = toggle.closest('li');
    const subUl = li.querySelector('.subcategories');

    if (!subUl) {
        console.error('toggleSubcategories - Subcategories element not found - Category ID:', categoryId);
        return;
    }

    if (subUl.classList.contains('open')) {
        subUl.classList.remove('open');
        toggle.textContent = '+';
        console.log('toggleSubcategories - Subcategories closed - ID:', categoryId);
    } else {
        if (subUl.children.length === 0) {
            try {
                console.log('toggleSubcategories - Fetching subcategories - Parent ID:', categoryId);
                const response = await authenticatedFetch(`${window.apiUrl}/categories?parent_id=${categoryId}`);
                if (!response.ok) throw new Error(`Failed to fetch subcategories: ${response.status}`);
                const data = await response.json();

                if (data.categories && data.categories.length > 0) {
                    data.categories.forEach(cat => {
                        const node = createTreeNode(cat, 1); // Level 1 for subcategories
                        subUl.appendChild(node);
                    });
                    console.log('toggleSubcategories - Subcategories loaded - Count:', data.categories.length, 'Parent ID:', categoryId);
                    toastr.success(`Subcategories for ${categoryId} loaded successfully`);
                } else {
                    toggle.textContent = ' '; // No subcategories
                    console.log('toggleSubcategories - No subcategories found - Parent ID:', categoryId);
                    toastr.info(`No subcategories for ${categoryId}`);
                    return;
                }
            } catch (error) {
                console.error('toggleSubcategories - Error loading subcategories - Error:', error.message, 'Stack:', error.stack);
                toastr.error(`Error loading subcategories: ${error.message}`);
                toggle.textContent = ' ';
                return;
            }
        }
        subUl.classList.add('open');
        toggle.textContent = '-';
        console.log('toggleSubcategories - Subcategories opened - ID:', categoryId);
    }
    console.log('toggleSubcategories - Toggle completed');
}

// Saves updated category structure from treeview (community context).
async function saveCategories(userId) {
    console.log('saveCategories - Starting category save - UserID:', userId);
    if (!userId) {
        console.error('saveCategories - User ID not provided');
        toastr.error('User ID not found in session');
        return;
    }

    const checkedCategories = Array.from(document.querySelectorAll('#categoryTree input[type="checkbox"]:checked')).map(cb => cb.value);
    console.log('saveCategories - Checked categories - Count:', checkedCategories.length, 'Values:', checkedCategories);

    try {
        console.log('saveCategories - Sending categories via authenticatedFetch - URL:', `${window.apiUrl}/${userId}/mycategories`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/mycategories`, {
            method: 'PUT',
            body: JSON.stringify({ categories: checkedCategories })
        });
        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            console.error('saveCategories - Fetch failed - Status:', response.status, 'Error:', errorText);
            throw new Error(`Failed to save categories: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('saveCategories - Save response received - Result:', JSON.stringify(result), 'Duration:', `${duration}ms`);
        toastr.success('Categories saved successfully');
    } catch (error) {
        console.error('saveCategories - Error saving categories - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Failed to save categories: ${error.message}`);
    }
    console.log('saveCategories - Save process completed');
}

// Handles category selection in admin context to load discounted products.
async function handleCategorySelection(categoryId, checkbox) {
    console.log('handleCategorySelection - Handling selection - Category ID:', categoryId, 'Checked:', checkbox.checked);
    document.querySelectorAll('#categoryTree input[type="checkbox"]').forEach(cb => {
        if (cb !== checkbox) cb.checked = false;
    });

    const tbody = document.getElementById('dealList');
    if (!tbody) {
        console.error('handleCategorySelection - Deal list element not found - ID: dealList');
        return;
    }

    if (checkbox.checked) {
        try {
            console.log('handleCategorySelection - Fetching discounted products - Category ID:', categoryId);
            const response = await authenticatedFetch(`${window.apiUrl}/discounted-products?category_id=${categoryId}&min_discount=20`);
            if (!response.ok) throw new Error(`Failed to fetch discounted products: ${response.status}`);
            const data = await response.json();

            tbody.innerHTML = '';
            data.products.forEach(product => {
                const tr = document.createElement('tr');
                const discountPercent = product.discount_percent || 
                    (product.original_price > product.current_price 
                        ? ((product.original_price - product.current_price) / product.original_price * 100).toFixed(2) 
                        : 'N/A');
                tr.innerHTML = `
                    <td>${product.category || 'N/A'}</td>
                    <td>${product.title}</td>
                    <td><a href="${product.product_url}" target="_blank">Link</a></td>
                    <td>${product.current_price}</td>
                    <td>${product.original_price}</td>
                    <td>${discountPercent}</td>
                    <td><img src="${product.image_url}" width="50" onerror="this.src='https://via.placeholder.com/50';"></td>
                    <td>${product.QTY || 'N/A'}</td>
                `;
                tbody.appendChild(tr);
            });
            console.log('handleCategorySelection - Products loaded - Count:', data.products.length);
            toastr.success(`Loaded ${data.products.length} discounted products for category ${categoryId}`);
        } catch (error) {
            console.error('handleCategorySelection - Error loading products - Error:', error.message, 'Stack:', error.stack);
            toastr.error(`Error loading discounted products: ${error.message}`);
            checkbox.checked = false;
            tbody.innerHTML = '';
        }
    } else {
        tbody.innerHTML = '';
        console.log('handleCategorySelection - Cleared deal list - Category deselected');
    }
    console.log('handleCategorySelection - Selection handling completed');
}// category-management.js
// Purpose: Manages treeview functionality for displaying and editing nested category information (used in community.html and admin.html).

// Creates a treeview node for category display with configurable behavior.
function createTreeNode(category, level = 0, isAdmin = false, savedCategories = []) {
    console.log('createTreeNode - Creating node - Category:', JSON.stringify(category), 'Level:', level, 'IsAdmin:', isAdmin);
    const li = document.createElement('li');
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'node';

    const toggle = document.createElement('span');
    toggle.className = 'toggle';
    toggle.setAttribute('data-id', category.id);
    toggle.textContent = '+'; // Default to '+' assuming subcategories may exist
    toggle.addEventListener('click', () => toggleSubcategories(category.id, toggle));

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = category.id;
    if (isAdmin) {
        checkbox.addEventListener('change', () => handleCategorySelection(category.id, checkbox));
    } else {
        checkbox.checked = savedCategories.includes(category.id.toString());
    }

    const span = document.createElement('span');
    span.textContent = `${category.name} (${category.id})`;

    nodeDiv.appendChild(toggle);
    nodeDiv.appendChild(checkbox);
    nodeDiv.appendChild(span);
    li.appendChild(nodeDiv);

    const subUl = document.createElement('ul');
    subUl.className = 'subcategories';
    li.appendChild(subUl);

    console.log('createTreeNode - Node created - Category ID:', category.id);
    return li;
}

// Loads category data for treeview rendering, with options for admin or community context.
async function loadCategories(userId = null, isAdmin = false) {
    console.log('loadCategories - Starting category load - UserID:', userId, 'IsAdmin:', isAdmin);
    let savedCategories = [];
    try {
        console.log('loadCategories - Fetching categories via authenticatedFetch');
        const startTime = Date.now();

        // Load user's saved categories if not admin
        if (!isAdmin && userId) {
            const userResponse = await authenticatedFetch(`${window.apiUrl}/${userId}/mycategories`);
            if (!userResponse.ok) throw new Error(`Failed to fetch user categories: ${userResponse.status}`);
            const userData = await userResponse.json();
            savedCategories = userData.categories || [];
            console.log('loadCategories - Saved categories fetched - Count:', savedCategories.length);
        }

        // Load all categories
        const response = await authenticatedFetch(`${window.apiUrl}/categories`);
        if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);
        const data = await response.json();
        const duration = Date.now() - startTime;
        console.log('loadCategories - Categories fetched - Count:', data.categories?.length, 'Duration:', `${duration}ms`);

        const treeElement = document.getElementById('categoryTree');
        if (!treeElement) {
            console.error('loadCategories - Tree element not found - ID: categoryTree');
            return;
        }
        treeElement.innerHTML = '';
        const ul = document.createElement('ul');

        // Filter top-level categories for community, show all for admin
        const categoriesToRender = isAdmin ? data.categories : data.categories.filter(cat => !cat.parent_id);
        console.log('loadCategories - Categories to render - Count:', categoriesToRender.length);

        categoriesToRender.forEach(category => {
            const node = createTreeNode(category, 0, isAdmin, savedCategories);
            ul.appendChild(node);
        });
        treeElement.appendChild(ul);

        // Reattach listeners for community context
        if (!isAdmin) attachEventListeners();

        console.log('loadCategories - Treeview rendered successfully');
        toastr.success('Categories loaded successfully');
    } catch (error) {
        console.error('loadCategories - Error loading categories - Error:', error.message, 'Stack:', error.stack);
        toastr.error('Failed to load categories');
    }
    console.log('loadCategories - Category load completed');
}

// Toggles visibility of subcategories in treeview and loads them dynamically if needed.
async function toggleSubcategories(categoryId, toggle) {
    console.log('toggleSubcategories - Toggling subcategories - Category ID:', categoryId);
    const li = toggle.closest('li');
    const subUl = li.querySelector('.subcategories');

    if (!subUl) {
        console.error('toggleSubcategories - Subcategories element not found - Category ID:', categoryId);
        return;
    }

    if (subUl.classList.contains('open')) {
        subUl.classList.remove('open');
        toggle.textContent = '+';
        console.log('toggleSubcategories - Subcategories closed - ID:', categoryId);
    } else {
        if (subUl.children.length === 0) {
            try {
                console.log('toggleSubcategories - Fetching subcategories - Parent ID:', categoryId);
                const response = await authenticatedFetch(`${window.apiUrl}/categories?parent_id=${categoryId}`);
                if (!response.ok) throw new Error(`Failed to fetch subcategories: ${response.status}`);
                const data = await response.json();

                if (data.categories && data.categories.length > 0) {
                    data.categories.forEach(cat => {
                        const node = createTreeNode(cat, 1); // Level 1 for subcategories
                        subUl.appendChild(node);
                    });
                    console.log('toggleSubcategories - Subcategories loaded - Count:', data.categories.length, 'Parent ID:', categoryId);
                    toastr.success(`Subcategories for ${categoryId} loaded successfully`);
                } else {
                    toggle.textContent = ' '; // No subcategories
                    console.log('toggleSubcategories - No subcategories found - Parent ID:', categoryId);
                    toastr.info(`No subcategories for ${categoryId}`);
                    return;
                }
            } catch (error) {
                console.error('toggleSubcategories - Error loading subcategories - Error:', error.message, 'Stack:', error.stack);
                toastr.error(`Error loading subcategories: ${error.message}`);
                toggle.textContent = ' ';
                return;
            }
        }
        subUl.classList.add('open');
        toggle.textContent = '-';
        console.log('toggleSubcategories - Subcategories opened - ID:', categoryId);
    }
    console.log('toggleSubcategories - Toggle completed');
}

// Saves updated category structure from treeview (community context).
async function saveCategories(userId) {
    console.log('saveCategories - Starting category save - UserID:', userId);
    if (!userId) {
        console.error('saveCategories - User ID not provided');
        toastr.error('User ID not found in session');
        return;
    }

    const checkedCategories = Array.from(document.querySelectorAll('#categoryTree input[type="checkbox"]:checked')).map(cb => cb.value);
    console.log('saveCategories - Checked categories - Count:', checkedCategories.length, 'Values:', checkedCategories);

    try {
        console.log('saveCategories - Sending categories via authenticatedFetch - URL:', `${window.apiUrl}/${userId}/mycategories`);
        const startTime = Date.now();
        const response = await authenticatedFetch(`${window.apiUrl}/${userId}/mycategories`, {
            method: 'PUT',
            body: JSON.stringify({ categories: checkedCategories })
        });
        const duration = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            console.error('saveCategories - Fetch failed - Status:', response.status, 'Error:', errorText);
            throw new Error(`Failed to save categories: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('saveCategories - Save response received - Result:', JSON.stringify(result), 'Duration:', `${duration}ms`);
        toastr.success('Categories saved successfully');
    } catch (error) {
        console.error('saveCategories - Error saving categories - Error:', error.message, 'Stack:', error.stack);
        toastr.error(`Failed to save categories: ${error.message}`);
    }
    console.log('saveCategories - Save process completed');
}

// Handles category selection in admin context to load discounted products.
async function handleCategorySelection(categoryId, checkbox) {
    console.log('handleCategorySelection - Handling selection - Category ID:', categoryId, 'Checked:', checkbox.checked);
    document.querySelectorAll('#categoryTree input[type="checkbox"]').forEach(cb => {
        if (cb !== checkbox) cb.checked = false;
    });

    const tbody = document.getElementById('dealList');
    if (!tbody) {
        console.error('handleCategorySelection - Deal list element not found - ID: dealList');
        return;
    }

    if (checkbox.checked) {
        try {
            console.log('handleCategorySelection - Fetching discounted products - Category ID:', categoryId);
            const response = await authenticatedFetch(`${window.apiUrl}/discounted-products?category_id=${categoryId}&min_discount=20`);
            if (!response.ok) throw new Error(`Failed to fetch discounted products: ${response.status}`);
            const data = await response.json();

            tbody.innerHTML = '';
            data.products.forEach(product => {
                const tr = document.createElement('tr');
                const discountPercent = product.discount_percent || 
                    (product.original_price > product.current_price 
                        ? ((product.original_price - product.current_price) / product.original_price * 100).toFixed(2) 
                        : 'N/A');
                tr.innerHTML = `
                    <td>${product.category || 'N/A'}</td>
                    <td>${product.title}</td>
                    <td><a href="${product.product_url}" target="_blank">Link</a></td>
                    <td>${product.current_price}</td>
                    <td>${product.original_price}</td>
                    <td>${discountPercent}</td>
                    <td><img src="${product.image_url}" width="50" onerror="this.src='https://via.placeholder.com/50';"></td>
                    <td>${product.QTY || 'N/A'}</td>
                `;
                tbody.appendChild(tr);
            });
            console.log('handleCategorySelection - Products loaded - Count:', data.products.length);
            toastr.success(`Loaded ${data.products.length} discounted products for category ${categoryId}`);
        } catch (error) {
            console.error('handleCategorySelection - Error loading products - Error:', error.message, 'Stack:', error.stack);
            toastr.error(`Error loading discounted products: ${error.message}`);
            checkbox.checked = false;
            tbody.innerHTML = '';
        }
    } else {
        tbody.innerHTML = '';
        console.log('handleCategorySelection - Cleared deal list - Category deselected');
    }
    console.log('handleCategorySelection - Selection handling completed');
}