const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const smallThreshold = parseInt(core.getInput('small-threshold'));
    const mediumThreshold = parseInt(core.getInput('medium-threshold'));
    const largeThreshold = parseInt(core.getInput('large-threshold'));
    const commentOnLarge = core.getInput('comment-on-large') === 'true';

    // Get PR context
    const context = github.context;
    if (!context.payload.pull_request) {
      core.setFailed('This action can only be run on pull_request events');
      return;
    }

    const pullRequest = context.payload.pull_request;
    const octokit = github.getOctokit(token);

    // Get PR details
    const { data: prData } = await octokit.rest.pulls.get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: pullRequest.number,
    });

    // Calculate total lines changed
    const additions = prData.additions;
    const deletions = prData.deletions;
    const totalChanges = additions + deletions;

    core.info(`PR #${pullRequest.number}: +${additions} -${deletions} (total: ${totalChanges} lines)`);

    // Determine size label
    let sizeLabel;
    if (totalChanges <= smallThreshold) {
      sizeLabel = 'small';
    } else if (totalChanges <= mediumThreshold) {
      sizeLabel = 'medium';
    } else if (totalChanges <= largeThreshold) {
      sizeLabel = 'large';
    } else {
      sizeLabel = 'extra-large';
    }

    core.info(`Determined size: ${sizeLabel}`);

    // Get existing labels
    const existingLabels = pullRequest.labels.map(label => label.name);
    const sizeLabels = ['small', 'medium', 'large', 'extra-large'];

    // Remove old size labels
    const labelsToRemove = existingLabels.filter(label =>
      sizeLabels.includes(label) && label !== sizeLabel
    );

    for (const label of labelsToRemove) {
      try {
        await octokit.rest.issues.removeLabel({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: pullRequest.number,
          name: label,
        });
        core.info(`Removed label: ${label}`);
      } catch (error) {
        core.warning(`Failed to remove label ${label}: ${error.message}`);
      }
    }

    // Add new size label if not already present
    if (!existingLabels.includes(sizeLabel)) {
      // First, ensure the label exists in the repository
      try {
        await octokit.rest.issues.getLabel({
          owner: context.repo.owner,
          repo: context.repo.repo,
          name: sizeLabel,
        });
      } catch (error) {
        // Label doesn't exist, create it
        const labelColors = {
          'small': '00ff00',
          'medium': 'ffff00',
          'large': 'ff9900',
          'extra-large': 'ff0000'
        };

        try {
          await octokit.rest.issues.createLabel({
            owner: context.repo.owner,
            repo: context.repo.repo,
            name: sizeLabel,
            color: labelColors[sizeLabel],
            description: `PR size: ${sizeLabel}`,
          });
          core.info(`Created label: ${sizeLabel}`);
        } catch (createError) {
          core.warning(`Failed to create label ${sizeLabel}: ${createError.message}`);
        }
      }

      // Add the label to the PR
      await octokit.rest.issues.addLabels({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: pullRequest.number,
        labels: [sizeLabel],
      });
      core.info(`Added label: ${sizeLabel}`);
    }

    // Comment on large PRs if enabled
    if (commentOnLarge && (sizeLabel === 'large' || sizeLabel === 'extra-large')) {
      const commentBody = `## ⚠️ Large Pull Request Detected

This PR has **${totalChanges} lines changed** (+${additions}/-${deletions}), which is marked as **${sizeLabel}**.

### Why does PR size matter?
- Smaller PRs are easier to review
- Faster feedback cycles
- Reduced risk of bugs
- Better context for reviewers

### Suggestions:
- Consider breaking this PR into smaller, focused changes
- Each PR should ideally address a single concern
- Aim for PRs under ${mediumThreshold} lines when possible

Thank you for your contribution! 🚀`;

      // Check if we already commented
      const { data: comments } = await octokit.rest.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: pullRequest.number,
      });

      const botComment = comments.find(comment =>
        comment.user.type === 'Bot' &&
        comment.body.includes('Large Pull Request Detected')
      );

      if (!botComment) {
        await octokit.rest.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: pullRequest.number,
          body: commentBody,
        });
        core.info('Posted comment about large PR');
      } else {
        core.info('Comment about large PR already exists, skipping');
      }
    }

    // Set outputs
    core.setOutput('size-label', sizeLabel);
    core.setOutput('lines-changed', totalChanges);

    core.info(`✅ PR Size Checker completed successfully`);
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();
