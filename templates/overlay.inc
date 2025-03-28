<div id="loadingOverlay" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 1); justify-content: center; align-items: center; z-index: 9999;">
    <div style="position: relative; width: 200px; height: 200px;">
        <div style="position: absolute; border-radius: 50%; border: 8px solid transparent; animation: spin 1.5s linear infinite; width: 120px; height: 120px; border-top-color: #ff6f61; top: 40px; left: 40px; animation-delay: 0s;"></div>
        <div style="position: absolute; border-radius: 50%; border: 8px solid transparent; animation: spin 1.5s linear infinite; width: 90px; height: 90px; border-top-color: #6bff61; top: 55px; left: 55px; animation-delay: 0.3s;"></div>
        <div style="position: absolute; border-radius: 50%; border: 8px solid transparent; animation: spin 1.5s linear infinite; width: 60px; height: 60px; border-top-color: #61cfff; top: 70px; left: 70px; animation-delay: 0.6s;"></div>
        <div style="position: absolute; border-radius: 50%; border: 8px solid transparent; animation: spin 1.5s linear infinite; width: 30px; height: 30px; border-top-color: #ff61ff; top: 85px; left: 85px; animation-delay: 0.9s;"></div>
    </div>
</div>
<style>
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>