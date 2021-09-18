# Questions
1. Our app’s main interface is a grid similar to Excel or Google Sheets.
- The grid should be able to handle up to 1000 columns
- The grid can have up to 1 000 000 rows
Using ReactJS, how would you implement the grid / which component would you choose to
handle a large amount of data? Why?
    ### Answer
        - To implement a grid with multiple rows and columns. I will use `react-virtualized` lib to improve the performance of our web application.
        We don't need to render 1000 columns or 1 000 000 rows at one time, we just need to render what user see or what they will interact
        React-virtualized helps us resolve this issue and improve the performance of our web application by limiting the number of calls to render as well as the number of DOM elements created and added to the page.
        
        - By default, all react-virtualized components use shallowCompare to avoid re-rendering unless props or state has changed.
        In this case, I use `Class Component` to do the example, I think `Class Component` easier to refactor more than `Function Component` when the logic becoming complex.


2. One feature in the grid is multi-cell selection by dragging the mouse. When the user scrolls
up/down/left/right of the grid, the selection should remain the same. Also, it should be possible
to copy that range value to clipboard and paste to our grid, google sheet or somewhere else.
Could you implement a React component for this feature, based on the selected method of
making the grid in question 1?

    ### Step to run
        1. yarn install
        2. yarn start