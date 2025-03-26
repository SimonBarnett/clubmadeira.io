Today we are making a flask. The Flask App is /madeira.py
My git hub is here:
https://github.com/SimonBarnett/Madeira/
There are four SPA permission based pages in /templates.
	/admin
	/community
	/merchant
	/partner
Routes are defined with blueprints in /bluprints
The app uses a login_required decorator from utils/auth.py for permissions
The main entry point of the app is /, which uses the /login template
from there, depending on user permssion, we redirect to one of the templates above.