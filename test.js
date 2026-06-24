const assert = require('assert');

// Import the algorithm directly or mock it to test server.js logic
// Since we want to test the algorithm inside server.js, we can construct the test by starting the express server or extracting the processGraph function.
// Let's require the processGraph function directly. Since server.js doesn't export it, we can create a temporary import-safe file or copy the logic to test.js.
// Copying/implementing the exact logic in test.js allows standalone validation of the algorithm!

const USER_ID = 'goran_24062026';
const EMAIL_ID = 'goran@college.edu';
const COLLEGE_ROLL_NUMBER = '22CS1001';

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

    if (child_to_parent[child]) {
      continue;
    }
    child_to_parent[child] = parent;
    active_edges.push({ from: parent, to: child });
  }

  const adjUndirected = {};
  const dirAdj = {};
  const inDegree = {};

  for (let edge of active_edges) {
    if (!adjUndirected[edge.from]) adjUndirected[edge.from] = [];
    if (!adjUndirected[edge.to]) adjUndirected[edge.to] = [];
    adjUndirected[edge.from].push(edge.to);
    adjUndirected[edge.to].push(edge.from);

    if (!dirAdj[edge.from]) dirAdj[edge.from] = [];
    dirAdj[edge.from].push(edge.to);

    if (!(edge.from in inDegree)) inDegree[edge.from] = 0;
    if (!(edge.to in inDegree)) inDegree[edge.to] = 0;
    inDegree[edge.to]++;
  }

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

  const hierarchies = [];
  let totalTrees = 0;
  let totalCycles = 0;
  let maxDepth = -1;
  let largestTreeRoot = "";

  function buildSubtree(node) {
    const children = dirAdj[node] || [];
    const sortedChildren = [...children].sort();
    const subtree = {};
    for (let child of sortedChildren) {
      subtree[child] = buildSubtree(child);
    }
    return subtree;
  }

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
    const roots = [];
    for (let node of comp) {
      if ((inDegree[node] || 0) === 0) {
        roots.push(node);
      }
    }

    if (roots.length === 1) {
      const root = roots[0];
      const tree = { [root]: buildSubtree(root) };
      const depth = getDepth(root);
      
      hierarchies.push({
        root,
        tree,
        depth
      });

      totalTrees++;

      if (depth > maxDepth) {
        maxDepth = depth;
        largestTreeRoot = root;
      } else if (depth === maxDepth) {
        if (!largestTreeRoot || root < largestTreeRoot) {
          largestTreeRoot = root;
        }
      }
    } else {
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
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
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

// ================= TEST CASES =================

console.log("Starting backend algorithm unit tests...\n");

// 1. PDF Example Test
try {
  const result = processGraph([
    "A->B", "A->C", "B->D", "C->E", "E->F",
    "X->Y", "Y->Z", "Z->X",
    "P->Q", "Q->R",
    "G->H", "G->H", "G->I",
    "hello", "1->2", "A->"
  ]);

  console.log("PDF Example Result:", JSON.stringify(result, null, 2));

  assert.deepStrictEqual(result.invalid_entries, ["hello", "1->2", "A->"]);
  assert.deepStrictEqual(result.duplicate_edges, ["G->H"]);
  assert.strictEqual(result.summary.total_trees, 3);
  assert.strictEqual(result.summary.total_cycles, 1);
  assert.strictEqual(result.summary.largest_tree_root, "A");

  // Check details of components
  assert.strictEqual(result.hierarchies[0].root, "A");
  assert.strictEqual(result.hierarchies[0].depth, 4);
  assert.deepStrictEqual(result.hierarchies[0].tree, {
    "A": { "B": { "D": {} }, "C": { "E": { "F": {} } } }
  });

  assert.strictEqual(result.hierarchies[1].root, "X");
  assert.strictEqual(result.hierarchies[1].has_cycle, true);
  assert.deepStrictEqual(result.hierarchies[1].tree, {});

  assert.strictEqual(result.hierarchies[2].root, "P");
  assert.strictEqual(result.hierarchies[2].depth, 3);

  assert.strictEqual(result.hierarchies[3].root, "G");
  assert.strictEqual(result.hierarchies[3].depth, 2);

  console.log("✅ Test Case 1 (PDF Example) Passed.");
} catch (err) {
  console.error("❌ Test Case 1 (PDF Example) Failed:", err);
}

// 2. Whitespace trimming and multiple duplicate checks
try {
  const result = processGraph([
    "  A->B  ",
    "A->B",
    " A->B",
    "B->C",
    "hello",
    ""
  ]);

  assert.deepStrictEqual(result.invalid_entries, ["hello", ""]);
  assert.deepStrictEqual(result.duplicate_edges, ["A->B"]);
  assert.strictEqual(result.summary.total_trees, 1);
  assert.strictEqual(result.hierarchies[0].root, "A");
  assert.strictEqual(result.hierarchies[0].depth, 3);

  console.log("✅ Test Case 2 (Trimming & Duplicates) Passed.");
} catch (err) {
  console.error("❌ Test Case 2 (Trimming & Duplicates) Failed:", err);
}

// 3. Diamond / Multi-parent Edge Discards
try {
  const result = processGraph([
    "A->C",
    "B->C"
  ]);

  // B->C should be discarded because C already has parent A
  // This leaves edge A->C. B is not connected because B->C is discarded and B has no other edges.
  // Component contains only A and C.
  assert.strictEqual(result.hierarchies.length, 1);
  assert.strictEqual(result.hierarchies[0].root, "A");
  assert.deepStrictEqual(result.hierarchies[0].tree, { "A": { "C": {} } });
  assert.strictEqual(result.hierarchies[0].depth, 2);

  console.log("✅ Test Case 3 (Multi-parent Diamond Discards) Passed.");
} catch (err) {
  console.error("❌ Test Case 3 (Multi-parent Diamond Discards) Failed:", err);
}

// 4. Pure Cycle lexicographical root naming
try {
  const result = processGraph([
    "Z->Y",
    "Y->X",
    "X->Z"
  ]);

  assert.strictEqual(result.summary.total_cycles, 1);
  assert.strictEqual(result.hierarchies[0].root, "X"); // X is lexicographically smallest of {X, Y, Z}
  assert.strictEqual(result.hierarchies[0].has_cycle, true);
  assert.deepStrictEqual(result.hierarchies[0].tree, {});

  console.log("✅ Test Case 4 (Cycle Root Tiebreaker) Passed.");
} catch (err) {
  console.error("❌ Test Case 4 (Cycle Root Tiebreaker) Failed:", err);
}

// 5. Tiebreaker for largest_tree_root
try {
  const result = processGraph([
    "A->B",
    "X->Y"
  ]);

  // Two trees (A->B and X->Y), both have depth 2.
  // Lexicographical tiebreaker should select A as largest_tree_root.
  assert.strictEqual(result.summary.largest_tree_root, "A");

  const result2 = processGraph([
    "X->Y",
    "A->B"
  ]);
  // Same, should select A
  assert.strictEqual(result2.summary.largest_tree_root, "A");

  console.log("✅ Test Case 5 (Largest Tree Tiebreaker) Passed.");
} catch (err) {
  console.error("❌ Test Case 5 (Largest Tree Tiebreaker) Failed:", err);
}

console.log("\nAll unit tests finished.");
