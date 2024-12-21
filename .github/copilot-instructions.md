# GitHub Copilot Instructions

## Code Generation Guidelines
- Use meaningful and descriptive variable/function names
- Follow PEP 8 style guide for Python code
- Add type hints to all function parameters and return values
- Include docstrings for all functions and classes
- Use async/await for I/O operations
- Implement proper error handling with specific error messages
- Add logging for important operations
- Keep functions focused and single-purpose
- Use dependency injection where appropriate

## Test Generation Guidelines
- Use pytest as the testing framework
- Follow the Arrange-Act-Assert pattern
- Create separate test files for each module
- Use descriptive test names that explain the test scenario
- Include both positive and negative test cases
- Test edge cases and error conditions
- Use fixtures for common test setups
- Aim for comprehensive test coverage
- Mock external dependencies appropriately

## Code Review Guidelines
- Verify proper error handling implementation
- Check for security vulnerabilities
- Ensure consistent logging practices
- Validate type hints usage
- Look for potential performance issues
- Verify API endpoint security
- Check for proper input validation
- Ensure code follows DRY principles
- Verify proper exception handling
- Look for potential memory leaks

## Commit Message Guidelines
- Follow Gitmoji convention
- Format: <emoji> (scope): <message>
- Add detailed body with file paths and specific changes
- Keep the subject line under 50 characters
- Use imperative mood in commit messages

Common Gitmoji usage:
- ✨ (sparkles): New features
- 🐛 (bug): Bug fixes
- ♻️ (recycle): Code refactoring
- 📝 (memo): Documentation updates
- 🔧 (wrench): Configuration changes
- ✅ (white_check_mark): Adding tests
- 🎨 (art): Improving structure/format
- ⚡️ (zap): Performance improvements
- 🔒 (lock): Security improvements
