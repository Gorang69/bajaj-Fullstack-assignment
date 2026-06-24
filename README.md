# Chitkara Graph Processing Engine 🌐

Welcome to the **Chitkara Graph Processing Engine**! This is a full-stack web application built for **Round 1 of the Chitkara Full Stack Engineering Challenge**.

This project takes a list of relationships between points (nodes) in a graph (like `A->B` meaning "A connects to B"), cleans the data, separates them into groups, finds trees, detects cycles, and displays everything on a beautiful, interactive dashboard.

---

## 🚀 How to Run the Project (Quick Start)

Follow these simple steps to run this project on your computer:

### 1. Prerequisites
Make sure you have **Node.js** installed on your computer. You can download it from [nodejs.org](https://nodejs.org/).

### 2. Install Dependencies
Open your command prompt or terminal in the project folder (`chitkara-challenge/`) and type:
```bash
npm install
```
This downloads the required backend server tools (Express, CORS, Dotenv).

### 3. Run the Server
To start the server, type:
```bash
npm start
```
You should see a message saying: `Server running on port 5000`.

### 4. Open the Web App
Open your web browser and go to:
👉 **[http://localhost:5000/](http://localhost:5000/)**

---

## 🎮 How to Use the App

1. **Paste your Data**: In the text box on the left, type or paste your node connections as a JSON list. For example:
   ```json
   ["A->B", "B->C", "X->Y", "Y->Z", "Z->X"]
   ```
2. **Use Presets**: If you don't want to type, simply click one of the **6 Preset Buttons** on the left (like *PDF Challenge Case*, *Pure Cycle*, or *Multi-Parent*). It will automatically load the data!
3. **Analyze**: Click the **Process Graph** button.
4. **Explore Output**: On the right side, you will see:
   * **Summary Stats**: Total number of trees, cycles, and which tree is the largest.
   * **Tree Visualizer (Tab 1)**: A neat, interactive directory tree diagram of your non-cyclic groups.
   * **Components Grid (Tab 2)**: Separate details cards for each group/component.
   * **JSON Response (Tab 3)**: The raw code response sent by the server (with a **Copy** button).
   * **Diagnostics (Tab 4)**: Logs displaying invalid strings or duplicate inputs that were ignored.

---

## 🛠️ Graph Rules & Requirements (What the App Does)

The backend processes the relationships according to the strict challenge rules:

1. **Format Validation**: Connections must be in the format `X->Y`, where X and Y are single capital letters (A-Z).
   * Empty spaces are trimmed automatically (e.g., `" A->B "` becomes `"A->B"` and is processed).
   * Formatting errors (like `"hello"`, `"1->2"`, or self-loops like `"A->A"`) are ignored and pushed to **Invalid Entries**.
2. **No Duplicates**: If you enter `"A->B"` multiple times, it only builds it once. The extra ones go to the **Duplicate Edges** log.
3. **One Parent Only (Multi-Parent Rule)**: A node can only have one parent. For example, if you enter `A->C` and `B->C`, node `C` has two parents. The first one in the list wins, and subsequent parent connections for `C` are discarded.
4. **Cycle Detection**: If a group of nodes forms a loop (like `X->Y->Z->X`), it is flagged as a cycle (`has_cycle: true`). The tree is set to empty `{}` and depth calculation is skipped.
5. **Cycle Root Selection**: In a loop, there is no root. The app automatically chooses the lexicographically smallest letter (e.g., `X` in `X->Y->Z->X`) as the root.
6. **Tie-Breaker Rule**: If two trees have the same depth, the tree with the lexicographically smaller root letter is declared the **Largest Tree**.

---

## 🧪 Testing the Code

We have created an automated test script to verify that all the rules are working perfectly. To run the tests, open your terminal and run:
```bash
npm test
```
This runs 5 test cases checking edge cases (PDF Example, Whitespace, Multi-Parent, Cycle Roots, and Tiebreakers) and ensures everything passes.

---

## ⚙️ Configuration (Changing Credentials)

You can customize your details in the `.env` file in the root folder:
```ini
USER_ID=gorangsharma_04222005
EMAIL_ID=gorang0422.be23@chitkara.edu.in
COLLEGE_ROLL_NUMBER=2310990422
PORT=5000
```
Simply edit these values, restart the server, and they will dynamically display in the dashboard navbar badge and return in the API response!
