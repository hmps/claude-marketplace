# Changelog

All notable changes to the Compounding Engineering will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-10-09

### Added

#### Agents (21 total)
- **Code Reviewers**
  - `kieran-rails-reviewer` - Super senior Rails reviewer with exceptionally high quality bar
  - `dhh-rails-reviewer` - Rails reviewer following DHH's principles
  - `cora-test-reviewer` - Test quality reviewer for minitest
  - `code-simplicity-reviewer` - Simplicity and maintainability reviewer

- **Quality Agents**
  - `security-sentinel` - Security-focused code reviewer
  - `performance-oracle` - Performance optimization expert
  - `lint` - Automated linting and style enforcement

- **Architecture Agents**
  - `architecture-strategist` - High-level architecture reviewer
  - `pattern-recognition-specialist` - Design pattern identifier
  - `data-integrity-guardian` - Database integrity reviewer

- **Workflow Agents**
  - `pr-comment-resolver` - PR feedback resolver
  - `git-history-analyzer` - Git history analyst
  - `bug-reproduction-validator` - Bug reproduction validator

- **Research Agents**
  - `repo-research-analyst` - Repository research expert
  - `best-practices-researcher` - Best practices researcher
  - `framework-docs-researcher` - Framework documentation searcher

- **Specialized Agents**
  - `every-style-editor` - Writing style guide enforcer
  - `assistant-component-creator` - UI component creator
  - `feedback-codifier` - Feedback task converter
  - `ahoy-tracking-expert` - Analytics implementation expert
  - `appsignal-log-investigator` - Log investigation specialist

#### Commands (24 total)
- **Review Commands**
  - `/code-review` - Comprehensive code review
  - `/review_relevant` - Review relevant changes only

- **Testing Commands**
  - `/test` - Run tests with guidance
  - `/reproduce-bug` - Create bug reproduction tests

- **Workflow Commands**
  - `/prepare_pr` - Prepare pull request
  - `/resolve_pr_parallel` - Resolve PR comments in parallel
  - `/resolve_todo_parallel` - Resolve code TODOs in parallel
  - `/triage` - Interactive triage workflow
  - `/cleanup` - Code cleanup automation

- **Documentation Commands**
  - `/create-developer-doc` - Create developer documentation
  - `/update-help-center` - Update help center
  - `/changelog` - Generate changelog
  - `/best_practice` - Document best practices
  - `/study` - Study codebase patterns
  - `/teach` - Create educational content

- **Business Commands**
  - `/create-pitch` - Create product pitches
  - `/help-me-market` - Marketing assistance
  - `/call-transcript` - Process call transcripts
  - `/featurebase_triage` - Triage user feedback

- **Utility Commands**
  - `/fix-critical` - Fix critical issues
  - `/issues` - Manage GitHub issues
  - `/proofread` - Proofread copy

#### Workflows (5 total)
- `/workflows/generate_command` - Generate custom commands
- `/workflows/plan` - Plan feature implementation
- `/workflows/review` - Comprehensive review workflow
- `/workflows/watch` - Monitor changes
- `/workflows/work` - Guided development workflow

#### Plugin Infrastructure
- Complete plugin.json manifest with metadata
- Comprehensive README with usage examples
- Installation instructions for every-env
- Documentation for all agents and commands

### Notes
- Initial release extracted from the compounding engineering principles
- Fully compatible with Claude Code v1.0.0+
- Optimized for Rails 7.0+ projects
- Includes permission configurations for safe operation

## Future Releases

### Planned for v1.1.0
- Additional Rails 8 specific agents
- Hotwire/Turbo specialized reviewers
- Enhanced test coverage analysis
- Integration with more CI/CD platforms

### Planned for v2.0.0
- Plugin marketplace integration
- Auto-update capabilities
- Plugin dependency management
- Custom agent templates
- Team collaboration features

---

[Unreleased]: https://github.com/EveryInc/compounding-engineering/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/EveryInc/compounding-engineering/releases/tag/v1.0.0
