# Agent Instructions & Design Guidelines

This document outlines specific rules and design choices that must be followed when generating code or making modifications to this project.

## UI/Visual Design

### 1. No Emojis
- **Rule:** Do not use emojis (e.g., 🚀, 👋, ⚠️) in the user interface or within the code for visual representation.
- **Reasoning:** To maintain a professional, consistent, and native look and feel across platforms.

### 2. Iconography
- **Rule:** Always use icon libraries instead of emojis.
- **Implementation:**
  - Use established icon sets compatible with the project's tech stack (e.g., `lucide-react-native`, `expo-vector-icons`, or the project's specific icon component).
  - Ensure icons are consistently styled (size, color, stroke width) to match the application's theme.

## Localization & Language

### 1. Portuguese (pt-BR) Required for User-Facing Text
- **Rule:** Always translate all user-facing text to Portuguese (Brazilian Portuguese, pt-BR).
- **Scope:** This applies to all components that will be read by users of the app, including:
  - Labels, titles, and headings
  - Button text and CTAs (Call-to-Action)
  - Placeholder text in input fields
  - Error messages and validation feedback
  - Tooltips and helper text
  - Navigation items and menu labels
  - Notifications and alerts
  - Empty state messages
- **Reasoning:** The primary user base of this application speaks Portuguese. Consistent localization ensures a seamless user experience.
- **Exceptions:** Code comments, variable names, function names, and developer-facing documentation may remain in English.

## General Coding Standards

- Adhere to the existing project structure and conventions.
- When in doubt about visual elements, prefer standard UI components and icons over text-based graphics or emojis.
