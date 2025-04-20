<!-- templates/roles.inc -->
{% if is_authenticated %}
    {% if page_type == 'admin' %}
        <button data-section="info" style="color: currentcolor; padding: 20px; border-radius: 8px; display: flex; align-items: center; gap: 25px; height: 120px; box-sizing: border-box; overflow: visible; background: none; border: none; width: 100%; text-align: left; cursor: pointer;">
            <span class="icon-admin" style="width: 50px; height: 50px;"></span>
            <div>
                <h1 style="margin: 0; font-size: 24px; color: currentcolor;">Admin Dashboard</h1>
                <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9; color: currentcolor;">Manage your platform with powerful tools and insights.</p>
            </div>
        </button>
    {% elif page_type == 'merchant' %}
        <button data-section="info" style="color: currentcolor; padding: 20px; border-radius: 8px; display: flex; align-items: center; gap: 15px; height: 120px; box-sizing: border-box; overflow: visible; background: none; border: none; width: 100%; text-align: left; cursor: pointer;">
            <span class="icon-merchant" style="width: 50px; height: 50px;"></span>
            <div>
                <h1 style="margin: 0; font-size: 24px; color: currentcolor;">Merchant Dashboard</h1>
                <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9; color: currentcolor;">Track sales, manage deals, and grow your business.</p>
            </div>
        </button>
    {% elif page_type == 'community' %}
        <button data-section="info" style="color: currentcolor; padding: 20px; border-radius: 8px; display: flex; align-items: center; gap: 15px; height: 120px; box-sizing: border-box; overflow: visible; background: none; border: none; width: 100%; text-align: left; cursor: pointer;">
            <span class="icon-community" style="width: 50px; height: 50px;"></span>
            <div>
                <h1 style="margin: 0; font-size: 24px; color: currentcolor;">Community Dashboard</h1>
                <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9; color: currentcolor;">Connect with members and share valuable resources.</p>
            </div>
        </button>
    {% elif page_type == 'partner' %}
        <button data-section="info" style="color: currentcolor; padding: 20px; border-radius: 8px; display: flex; align-items: center; gap: 15px; height: 120px; box-sizing: border-box; overflow: visible; background: none; border: none; width: 100%; text-align: left; cursor: pointer;">
            <span class="icon-partner" style="width: 50px; height: 50px;"></span>
            <div>
                <h1 style="margin: 0; font-size: 24px; color: currentcolor;">Partner Dashboard</h1>
                <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9; color: currentcolor;">Collaborate and create with our partner tools.</p>
            </div>
        </button>
    {% else %}
        <button data-section="info" style="color: currentcolor; padding: 20px; border-radius: 8px; display: flex; align-items: center; gap: 15px; height: 120px; box-sizing: border-box; overflow: visible; background: none; border: none; width: 100%; text-align: left; cursor: pointer;">
            <span class="icon-community" style="width: 50px; height: 50px;"></span>
            <div>
                <h1 style="margin: 0; font-size: 24px; color: currentcolor;">Welcome to clubmadeira.io</h1>
                <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9; color: currentcolor;">Log in to access your dashboard.</p>
            </div>
        </button>
    {% endif %}
{% else %}
    <button data-section="info" style="color: currentcolor; padding: 20px; border-radius: 8px; display: flex; align-items: center; gap: 15px; height: 120px; box-sizing: border-box; overflow: visible; background: none; border: none; width: 100%; text-align: left; cursor: pointer;">
        <span class="icon-community" style="width: 50px; height: 50px;"></span>
        <div>
            <h1 style="margin: 0; font-size: 24px; color: currentcolor;">Welcome to clubmadeira.io</h1>
            <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9; color: currentcolor;">Log in to access your dashboard.</p>
        </div>
    </button>
    <div id="info" class="section" style="display: none;">
        <h2>Login</h2>
        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="text" id="email" name="email">
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <div class="password-wrapper">
                    <input type="password" id="password" name="password">
                    <span class="toggle-password"><i class="fa fa-eye"></i></span>
                </div>
            </div>
            <button type="submit"><i class="fas fa-sign-in-alt"></i> Login</button>
        </form>
    </div>
{% endif %}