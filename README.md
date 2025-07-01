# Taskception

A modern, responsive task management application built with React, Vite, and TypeScript, featuring nested tasks and drag-and-drop reordering. Includes a flexible database framework with graceful fallback to local storage when offline.

## Features

- **Nested Task Items**: Organize tasks hierarchically.
- **Drag-and-Drop Reordering**: Intuitively rearrange tasks and subtasks using `dnd-kit`.
- **Flexible Data Storage**: Auto-scaling database framework with graceful fallback to local storage.
- **Light/Dark Theme Toggle**: Switch between different visual themes for comfortable viewing.
- **Responsive Design**: Optimized for various screen sizes using Tailwind CSS.

## Technologies Used

- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS
- **State Management/Backend**: Supabase (Database, Authentication)
- **Drag and Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
- **Icons**: `lucide-react`
- **Utilities**: `uuid`

## Installation

To get the project up and running on your local machine, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone http://github.com/brownjasonlee/Taskception
    cd Taskception
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up Supabase** (Optional): This project uses a database framework that gracefully falls back to local storage.
    -   **For local-only usage**: Skip this step - the app will work with local storage
    -   **For database persistence**: 
        -   Go to [Supabase](https://supabase.com/) and create a new project
        -   Navigate to `Project Settings > API` to find your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
        -   Create `.env.local` in the root of your project:
            ```
            VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
            VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
            ```
        -   Run the database migration: `supabase/migrations/20241229_create_todos_table.sql`

## Running the Project

Once installed, you can run the application in development mode:

```bash
npm run dev
```

This will open the application in your browser, typically at `http://localhost:5173`.

## Future Improvements

1.  **User Authentication and Multiple Users**: Implement a robust authentication system to allow multiple users to manage their own distinct todo lists, rather than a single shared list.
2.  **Enhanced Error Handling and UI Feedback**: Improve the user experience by adding more explicit error messages, loading indicators, and success notifications for all data operations with Supabase.
3.  **Advanced Filtering, Sorting, and Searching**: Add options to filter todos by completion status, priority, or due dates. Implement a search functionality to quickly find specific tasks.

## Potential Bugs to Address

1.  **Drag-and-Drop Edge Cases**: Complex nesting and rapid drag operations might reveal subtle bugs related to reordering, especially when moving items between different parent tasks or deep nesting levels.
2.  **Supabase Synchronization Inconsistencies**: There's a potential for UI state to become desynchronized with the Supabase backend during network interruptions or concurrent updates, leading to visual inconsistencies or data loss.
3.  **Performance Bottlenecks with Large Datasets**: As the number of tasks and nested levels increases significantly, re-rendering the entire todo list or performing drag-and-drop operations might lead to performance degradation.
