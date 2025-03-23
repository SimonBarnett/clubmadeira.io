from flask import abort, render_template_string
import requests
import markdown

@app.route('/render-github-md/<owner>/<repo>/<branch>/<path:path>')
def render_github_md(owner, repo, branch, path):
    # Ensure the file is a Markdown file
    if not path.endswith('.md'):
        abort(404, "Not a Markdown file")
    
    # Construct the URL to fetch the raw Markdown content from GitHub
    url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
    
    # Fetch the content
    response = requests.get(url)
    if response.status_code == 200:
        md_content = response.text
        # Convert Markdown to HTML with tables extension
        html_content = markdown.markdown(md_content, extensions=['tables'])
        # Render the HTML in a simple template
        return render_template_string('''
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Rendered Markdown</title>
                <style>
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        margin: 20px 0;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                </style>
            </head>
            <body>
                {{ content | safe }}
            </body>
            </html>
        ''', content=html_content)
    else:
        abort(404, "File not found")