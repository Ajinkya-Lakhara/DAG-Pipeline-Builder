# DAG Pipeline Builder

A React‑based visual pipeline editor that lets you build and validate Directed Acyclic Graphs (DAGs) in real time.  
**Live Demo:** [https://dag-pipeline-builder.vercel.app/](https://dag-pipeline-builder.vercel.app/)  
**Source Code:** [github.com/Ajinkya-Lakhara/DAG-Pipeline-Builder](https://github.com/Ajinkya-Lakhara/DAG-Pipeline-Builder.git)

---
<img width="1919" height="863" alt="image" src="https://github.com/user-attachments/assets/86cebebb-4576-4aa0-a8a3-40263006a517" />

## 🚀 Features

- **Add / Delete Nodes**  
  - Click **Add Node**, enter a label, and a draggable node appears.  
  - Press `Delete` or click “Remove” to delete selected nodes.

- **Draw Directed Edges**  
  - Drag from an output handle of one node to an input handle of another.  
  - Prevents invalid connections: no self‑loops, no in→in or out→out links.

- **Live DAG Validation**  
  - Real‑time status indicator: **Valid** or **Invalid**.  
  - Checks include:  
    - Minimum of two nodes  
    - No cycles  
    - All nodes in one connected component  
    - Edge‑direction rules enforced

- **Auto Layout**  
  - One‑click rearrangement using [dagre](https://github.com/dagrejs/dagre)  
  - Automatically fits the graph to the viewport for a clean left‑to‑right layout.

- **JSON Preview**  
  - Inspect current DAG data structure as formatted JSON for debugging or export.

---

## ⚙️ Setup & Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/Ajinkya-Lakhara/DAG-Pipeline-Builder.git
cd DAG-Pipeline-Builder

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
# → Opens at http://localhost:5173

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```
## 📚 Tech Stack & Decisions

- **React + TypeScript + Vite**  
  Fast builds, hot module replacement (HMR), and strong type safety.

- **React Flow**  
  Core canvas for nodes & edges, drag‑and‑drop, connection handling, and `fitView()`.

- **Dagre**  
  Auto‑layout engine for hierarchical node positioning.

- **Tailwind CSS**  
  Utility‑first styling for rapid UI development.

- **Custom Validation**  
  - Depth‑first search for cycle detection  
  - Enforced on every connection event for instant feedback  

---

## 🤔 Challenges Faced

- **Efficient Cycle Detection**  
  Keeping the UI responsive while validating on each edge addition.

- **Custom Edge Rules**  
  Overriding React Flow defaults to block invalid handle connections (in→in, out→out, self‑loops).

- **Integrating Dagre**  
  Mapping Dagre’s output coordinates into React Flow nodes.


