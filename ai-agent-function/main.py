# main.py
import base64
import json
import os
import time
from typing import Dict, Any
import hashlib
import re

import vertexai
from vertexai.generative_models import GenerativeModel
from github import Github, GithubException

# --- Configuration ---
# Use environment variables for configuration.
# In Cloud Functions, you can set these in the deployment settings.
GITHUB_REPO_NAME = os.environ.get("GITHUB_REPO", "your-org/your-repo")
# The GITHUB_TOKEN should be stored in Secret Manager and accessed securely.
GITHUB_TOKEN = os.environ.get("GEMINI_GITHUB_TOKEN")
PROJECT_ID = os.environ.get("GCP_PROJECT") # This is automatically set in Cloud Functions
LOCATION = os.environ.get("GCP_LOCATION", "us-central1") # Or your preferred GCP region
# Define your app's package prefix to find the root cause in the stack trace.
APP_PACKAGE_PREFIX = os.environ.get("APP_PACKAGE_PREFIX", "com.ramjin.mytennisteam")


def generate_error_fingerprint(log_entry: Dict[str, Any]) -> tuple[str, str | None, int | None]:
    """
    Creates a robust, stable fingerprint from a log entry by hashing the
    exception type and the top-most application-specific stack trace element.
    """
    payload = log_entry.get("jsonPayload", {}) or {}
    stack_trace = payload.get("message", "") or log_entry.get("textPayload", "")

    if not stack_trace:
        return "generic-error-no-payload", None, None

    # 1. Find the exception type (e.g., java.lang.NullPointerException)
    # This regex looks for a word with dots, followed by an 'Exception' or 'Error'.
    exception_match = re.search(r"([\w\.]+(?:Exception|Error))", stack_trace)
    exception_type = exception_match.group(1) if exception_match else "UnknownException"

    # 2. Find the top-most stack frame that originates from our application code.
    # This is more reliable than just using the first line of the error.
    root_cause_line = None
    file_name = None
    line_number = None
    stack_lines = stack_trace.split('\n')
    for line in stack_lines:
        line = line.strip()
        # Look for lines like "at com.mycompany.app.MyClass.myMethod(MyClass.java:123)"
        if line.startswith("at ") and APP_PACKAGE_PREFIX in line:
            root_cause_line = line
            break # We found the most relevant line
    
    # Try to parse file and line number from the root cause line
    if root_cause_line:
        match = re.search(r'\(([^:]+):(\d+)\)', root_cause_line)
        if match:
            file_name, line_number_str = match.groups()
            line_number = int(line_number_str)

    # If no app-specific line was found, fall back to the first line of the trace
    if not root_cause_line and len(stack_lines) > 1:
        # Find the first 'at ...' line as a fallback
        for line in stack_lines:
            if line.strip().startswith("at "):
                root_cause_line = line.strip()
                break

    # If we still have nothing, use the exception type itself.
    if not root_cause_line:
        root_cause_line = exception_type

    # 3. Create a stable string and hash it for a consistent fingerprint.
    stable_string = f"{exception_type}:{root_cause_line}"
    fingerprint = hashlib.sha256(stable_string.encode('utf-8')).hexdigest()

    return fingerprint[:16], file_name, line_number


def get_source_code_from_github(file_name: str) -> tuple[str | None, str | None]:
    """Finds a file in the repo and returns its path and content."""
    if not GITHUB_TOKEN or not file_name:
        return None, None
    
    try:
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(GITHUB_REPO_NAME)

        # --- STRATEGY 1: Direct Path Construction (More Reliable) ---
        # For an Android project, the path is usually structured like this.
        # We get the package from the APP_PACKAGE_PREFIX env var.
        package_path = APP_PACKAGE_PREFIX.replace('.', '/')
        # This assumes a standard Android/Java project structure.
        # You might need to adjust this if your structure is different.
        constructed_path = f"app/src/main/java/{package_path}/services/{file_name}"
        print(f"  - Attempting to fetch file directly at: '{constructed_path}'")
        try:
            file_contents = repo.get_contents(constructed_path)
            print("  - Direct fetch successful.")
            return file_contents.path, file_contents.decoded_content.decode("utf-8")
        except GithubException as e:
            if e.status == 404:
                print("  - Direct fetch failed (404). Falling back to code search.")
            else:
                raise e # Re-raise other GitHub errors

        # --- STRATEGY 2: Fallback to Code Search ---
        print(f"  - Attempting to find '{file_name}' via code search...")
        query = f"filename:{file_name} repo:{GITHUB_REPO_NAME}"
        results = g.search_code(query)
        if results.totalCount > 0:
            code_file = results[0]
            print(f"  - Code search found file at path: {code_file.path}")
            content = code_file.decoded_content.decode("utf-8")
            return code_file.path, content

        print(f"  - ERROR: Could not find file '{file_name}' in repo '{GITHUB_REPO_NAME}' using any method.")
        return None, None
    except Exception as e:
        print(f"  - ERROR: An unexpected error occurred while fetching source code from GitHub: {e}")
        return None, None


def analyze_error_with_ai(
    log_entry: Dict[str, Any],
    source_file_path: str | None,
    source_code: str | None,
    line_number: int | None
) -> Dict[str, Any] | None:
    """
    Sends error details to the Gemini model on Vertex AI and returns a structured fix.
    """
    print("Step 3: Analyzing error with Gemini on Vertex AI...")

    try:
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        model = GenerativeModel("gemini-2.5-pro")
        # Extract relevant details from the log entry.
        # The structure of `log_entry` depends on your application's logging format.
        error_details = json.dumps(log_entry.get("jsonPayload") or log_entry.get("textPayload"), indent=2)

        # Construct a detailed prompt for the model.
        # Providing a clear structure for the output (like JSON) is crucial.
        source_code_context = ""
        if source_code and source_file_path:
            source_code_context = f"""
        I have retrieved the source code for the suspected file `{source_file_path}`.
        The error likely occurred at or near line {line_number}.

        Source Code (`{source_file_path}`):
        ```
        {source_code}
        ```
        """

        prompt = f"""
        You are an expert software engineer specializing in automated debugging.
        Analyze the following application error log and determine a root cause and a fix.
        {source_code_context}

        Error Log:
        ```json
        {error_details}
        ```

        Based on all the provided context (the error log and the source code), perform your analysis.
        
        Your task is to provide a response in a clean JSON format. Do not include any text outside of the JSON block.
        The JSON object must contain the following keys:
        - "pr_title": A concise, conventional commit style title for a pull request (e.g., "fix: Prevent NullPointerException in UserProcessor").
        - "pr_body": A markdown-formatted description for the pull request body, explaining the problem and the solution.
        - "suggested_fix": A JSON object with the details of the code change, containing these keys:
            - "old_code": The exact line or block of code to be replaced.
            - "new_code": The new code that implements the fix.

        If you cannot determine a confident fix, return a JSON object with an "error" key.
        Example of a successful response:
        {{
            "pr_title": "fix: Handle potential None value in user processing",
            "pr_body": "**Problem:** The application crashed due to a NullPointerException. **Solution:** Added a null check before accessing the user object.",
            "suggested_fix": {{
                "old_code": "String name = user.getName();",
                "new_code": "String name = (user != null) ? user.getName() : \\"default\\";"
            }}
        }}
        """

        print("  - Sending prompt to Gemini...")
        response = model.generate_content(prompt)
        
        # Clean up the response to extract only the JSON part.
        cleaned_response_text = response.text.strip().replace("```json", "").replace("```", "")
        
        print("  - AI Analysis Complete. Parsing response.")
        analysis_result = json.loads(cleaned_response_text)

        if "error" in analysis_result:
            print(f"  - AI could not determine a fix: {analysis_result['error']}")
            return None

        return analysis_result

    except Exception as e:
        print(f"An error occurred during AI analysis: {e}")
        return None


def create_pull_request(
    analysis_result: Dict[str, Any],
    error_fingerprint: str,
    file_path_to_modify: str
) -> str | None:
    """
    Placeholder for a function that creates a pull request in your Git repository.

    In a real implementation, you would use a library like PyGithub to:
    1. Authenticate with your GitHub token.
    2. Get the repository object.
    3. Create a new branch from 'main' or 'develop'.
    4. Get the contents of the file to be changed.
    5. Update the file content with the fix.
    6. Create a commit.
    7. Open a pull request.
    """
    if not GITHUB_TOKEN:
        print("  - ERROR: GITHUB_TOKEN environment variable not set. Cannot create PR.")
        return None

    print("Step 4: Creating Pull Request...")
    
    try:
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(GITHUB_REPO_NAME)
        print(f"repo url {repo.url}")
        
        fix_details = analysis_result['suggested_fix']
        branch_name = f"ai-fix/bug-{int(time.time())}"
        base_branch_name = "main" # Or "develop", etc.

        # --- Real Git Operations ---
        print(f"  - Creating branch '{branch_name}' from '{base_branch_name}'")
        source_branch = repo.get_branch(base_branch_name)
        repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=source_branch.commit.sha)

        # Get the current content of the file and replace the old code with the new code
        file_contents = repo.get_contents(file_path_to_modify, ref=branch_name)
        old_content_str = file_contents.decoded_content.decode("utf-8")
        
        if fix_details['old_code'] not in old_content_str:
            print(f"  - ERROR: 'old_code' not found in file '{fix_details['file_path']}'. Aborting.")
            # You might want to delete the branch here as cleanup
            # repo.get_git_ref(f"heads/{branch_name}").delete()
            return None

        new_content_str = old_content_str.replace(fix_details['old_code'], fix_details['new_code'])

        commit_message = analysis_result['pr_title']
        print(f"  - Committing changes to '{file_path_to_modify}'")
        repo.update_file(
            path=file_contents.path,
            message=commit_message,
            content=new_content_str,
            sha=file_contents.sha,
            branch=branch_name
        )

        # Add the fingerprint to the PR body as a hidden comment
        pr_body_with_fingerprint = (
            f"{analysis_result['pr_body']}\n\n"
            f"<!-- ERROR_FINGERPRINT:{error_fingerprint} -->"
        )

        print(f"  - Opening pull request in '{GITHUB_REPO_NAME}'")
        pr = repo.create_pull(
            title=analysis_result['pr_title'],
            body=pr_body_with_fingerprint,
            head=branch_name,
            base=base_branch_name
        )
        
        print(f"  - PR successfully created at: {pr.html_url}")
        return pr.html_url

    except GithubException as e:
        print(f"  - ERROR: A GitHub API error occurred: {e.status} {e.data}")
        return None
    except Exception as e:
        print(f"  - ERROR: An unexpected error occurred during PR creation: {e}")
        return None


def entrypoint(event: Dict[str, Any]) -> None:
    """
    Cloud Function entry point triggered by a Pub/Sub message.
    
    Args:
         event (dict):  The dictionary with data specific to this type of event.
                        For HTTP triggers, this is a Flask Request object.
    """
    print("Function triggered")

    # For an HTTP trigger, the actual Pub/Sub message is in the JSON body of the request.
    pubsub_envelope = event.get_json()

    # 1. Decode the incoming Pub/Sub message
    if 'message' in pubsub_envelope and 'data' in pubsub_envelope['message']:
        pubsub_message_data = base64.b64decode(pubsub_envelope['message']['data']).decode('utf-8')
        print(f"  - Decoded Pub/Sub message: {pubsub_message_data}")
        log_entry = json.loads(pubsub_message_data)
        print("Step 1: Pub/Sub message decoded.")
    else:
        print(f"Error: Invalid payload format. Expected 'message' with 'data'. Payload: {pubsub_envelope}")
        return "Invalid payload format", 400

    # 2. Generate a fingerprint for the error and check for existing PRs
    error_fingerprint, file_name, line_number = generate_error_fingerprint(log_entry)
    print(f"Step 2: Generated error fingerprint: {error_fingerprint}")
    print("file name", file_name)
    print("line number", line_number)

    if check_for_existing_pr(error_fingerprint):
        print("  - An open PR for this error already exists. Halting execution.")
        return "Existing PR found, halting.", 200
    else:
        print("  - No existing PR found. Proceeding...")

    # 3. Get source code context if available
    source_file_path, source_code = None, None
    if file_name:
        source_file_path, source_code = get_source_code_from_github(file_name)

    # 4. Analyze the error with an AI model (if no existing PR was found)
    analysis_result = analyze_error_with_ai(log_entry, source_file_path, source_code, line_number)

    print("analysis_result", analysis_result)
    print("source_file_path", source_file_path)
    print("source_code", source_code)

    # 5. Create a Pull Request with the suggested fix
    # We use the 'source_file_path' we found, not one from the AI, to prevent hallucinations.
    if analysis_result and source_file_path:
        create_pull_request(analysis_result, error_fingerprint, source_file_path)
    elif not source_file_path:
        print("Skipping PR creation because the source file could not be located in the repository.")
    else:
        print("AI analysis did not yield a confident fix. Skipping PR creation.")

    return "Processing complete.", 200

def check_for_existing_pr(fingerprint: str) -> bool:
    """Checks if an open PR with the given error fingerprint already exists."""
    if not GITHUB_TOKEN:
        print("  - WARNING: GITHUB_TOKEN not set. Cannot check for existing PRs.")
        return False # Fail open to allow analysis
    try:
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(GITHUB_REPO_NAME)
        open_pulls = repo.get_pulls(state='open')
        search_string = f"<!-- ERROR_FINGERPRINT:{fingerprint} -->"
        for pr in open_pulls:
            if pr.body and search_string in pr.body:
                print(f"  - Found matching open PR: #{pr.number}")
                return True
        return False
    except Exception as e:
        print(f"  - WARNING: Could not check for existing PRs due to an error: {e}")
        return False # Fail open to allow analysis
