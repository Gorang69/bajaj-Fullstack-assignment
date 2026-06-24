const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON request body
app.use(express.json());

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Retrieve identity credentials from environment or use defaults
const USER_ID = process.env.USER_ID || 'goran_24062026';
const EMAIL_ID = process.env.EMAIL_ID || 'goran@college.edu';
const COLLEGE_ROLL_NUMBER = process.env.COLLEGE_ROLL_NUMBER || '22CS1001';

/**
 * Helper to process graph edges and construct trees/cycles
 */
function processGraph(data) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const seen_edges = new Set();
  const child_to_parent = {};
  const active_edges = [];

  if (!Array.isArray(data)) {
    return {
      hierarchies: [],
      invalid_entries: [],
      duplicate_edges: [],
      summary: { total_trees: 0, total_cycles: 0, largest_tree_root: "" }
    };
  }

  // 1. Parse, validate, filter, and track duplicates/multi-parent discards
  for (let entry of data) {
    if (typeof entry !== 'string') {
      invalid_entries.push(String(entry));
      continue;
    }
    const trimmed = entry.trim();
    if (!/^[A-Z]->[A-Z]$/.test(trimmed)) {
      invalid_entries.push(trimmed);
      continue;
    }

    const [parent, child] = trimmed.split('->');
    
    // Self-loops are treated as invalid
    if (parent === child) {
      invalid_entries.push(trimmed);
      continue;
    }

    if (seen_edges.has(trimmed)) {
      if (!duplicate_edges.includes(trimmed)) {
        duplicate_edges.push(trimmed);
      }
      continue;
    }
    seen_edges.add(trimmed);

    // Multi-parent rule: first encountered wins; subsequent are discarded
    if (child_to_parent[child]) {
      // Silently discard edge from tree construction
      continue;
    }
    child_to_parent[child] = parent;
    active_edges.push({ from: parent, to: child });
  }

  // 2. Build adjacency structures for active graph
  const adjUndirected = {};
  const dirAdj = {};
  const allNodes = new Set();
  const inDegree = {};

  for (let edge of active_edges) {
    allNodes.add(edge.from);
    allNodes.add(edge.to);

    // Undirected adj (for finding weakly connected components)
    if (!adjUndirected[edge.from]) adjUndirected[edge.from] = [];
    if (!adjUndirected[edge.to]) adjUndirected[edge.to] = [];
    adjUndirected[edge.from].push(edge.to);
    adjUndirected[edge.to].push(edge.from);

    // Directed adj (for tree construction)
    if (!dirAdj[edge.from]) dirAdj[edge.from] = [];
    dirAdj[edge.from].push(edge.to);

    // Initialize inDegree map
    if (!(edge.from in inDegree)) inDegree[edge.from] = 0;
    if (!(edge.to in inDegree)) inDegree[edge.to] = 0;
    inDegree[edge.to]++;
  }

  // 3. Find weakly connected components in the order of first node appearance
  const visited = new Set();
  const components = [];

  for (let edge of active_edges) {
    if (!visited.has(edge.from)) {
      const comp = new Set();
      const queue = [edge.from];
      visited.add(edge.from);

      while (queue.length > 0) {
        const u = queue.shift();
        comp.add(u);
        const neighbors = adjUndirected[u] || [];
        for (let v of neighbors) {
          if (!visited.has(v)) {
            visited.add(v);
            queue.push(v);
          }
        }
      }
      components.push(comp);
    }
  }

  // 4. Build hierarchy object for each component
  const hierarchies = [];
  let totalTrees = 0;
  let totalCycles = 0;
  let maxDepth = -1;
  let largestTreeRoot = "";

  // Helper for recursive subtree construction
  function buildSubtree(node) {
    const children = dirAdj[node] || [];
    const sortedChildren = [...children].sort();
    const subtree = {};
    for (let child of sortedChildren) {
      subtree[child] = buildSubtree(child);
    }
    return subtree;
  }

  // Helper for depth calculation (number of nodes on longest path)
  function getDepth(node) {
    const children = dirAdj[node] || [];
    if (children.length === 0) {
      return 1;
    }
    let maxChildDepth = 0;
    for (let child of children) {
      maxChildDepth = Math.max(maxChildDepth, getDepth(child));
    }
    return 1 + maxChildDepth;
  }

  for (let comp of components) {
    // Find roots (in-degree == 0) within this component
    const roots = [];
    for (let node of comp) {
      if ((inDegree[node] || 0) === 0) {
        roots.push(node);
      }
    }

    if (roots.length === 1) {
      // Non-cyclic tree
      const root = roots[0];
      const tree = { [root]: buildSubtree(root) };
      const depth = getDepth(root);
      
      hierarchies.push({
        root,
        tree,
        depth
      });

      totalTrees++;

      // Track largest tree root (tiebreaker: lexicographically smaller root)
      if (depth > maxDepth) {
        maxDepth = depth;
        largestTreeRoot = root;
      } else if (depth === maxDepth) {
        if (!largestTreeRoot || root < largestTreeRoot) {
          largestTreeRoot = root;
        }
      }
    } else {
      // Cyclic component
      // Root is the lexicographically smallest node in the component
      const sortedNodes = Array.from(comp).sort();
      const root = sortedNodes[0];

      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });

      totalCycles++;
    }
  }

  return {
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: largestTreeRoot
    }
  };
}

// POST /bfhl endpoint
app.post('/bfhl', (req, res) => {
  try {
    const { data } = req.body;

    if (!req.body || data === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing 'data' field in request body."
      });
    }

    if (!Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: "'data' field must be an array of strings."
      });
    }

    const processed = processGraph(data);

    return res.status(200).json({
      user_id: USER_ID,
      email_id: EMAIL_ID,
      college_roll_number: COLLEGE_ROLL_NUMBER,
      hierarchies: processed.hierarchies,
      invalid_entries: processed.invalid_entries,
      duplicate_edges: processed.duplicate_edges,
      summary: processed.summary
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error. Please try again."
    });
  }
});

// GET / health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
