const fs = require('fs');
const file1 = '/home/snor/.local/share/opencode/tool-output/tool_e22d2d9b5001Z4l4LMwexIB1kQ';
const file2 = '/home/snor/.local/share/opencode/tool-output/tool_e22d2dad8001e1BPlc7KVFrIjx';

function analyze(filePath, flowName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    if (!data.flowData) return;
    const flowData = typeof data.flowData === 'string' ? JSON.parse(data.flowData) : data.flowData;
    
    console.log(`\n=== Flow: ${data.name} (${flowName}) ===`);
    const nodes = flowData.nodes || [];
    console.log(`Total nodes: ${nodes.length}`);
    
    const contextDetector = nodes.find(n => n.data.label === 'Context Detector' || n.data.name === 'Context Detector' || (n.data.label && n.data.label.includes('Context')));
    if (contextDetector) {
      console.log(`- HAS Context Detector: ${contextDetector.data.label} (${contextDetector.data.name})`);
    } else {
      console.log(`- NO Context Detector`);
    }

    const vectorStores = nodes.filter(n => n.data.name.includes('supabase') || n.data.category === 'Vector Stores' || n.data.name.includes('Pinecone') || n.data.name.includes('Qdrant') || n.data.name.toLowerCase().includes('vectorstore'));
    if (vectorStores.length > 0) {
      console.log(`- HAS Vector Stores:`);
      vectorStores.forEach(v => console.log(`  * ${v.data.label} (${v.data.name})`));
    } else {
      console.log(`- NO Vector Stores`);
    }
  } catch (e) {
    console.error(`Error processing ${filePath}:`, e.message);
  }
}

analyze(file1, 'a6228a84-c8b7-449b-b484-7ae942cc0386');
analyze(file2, '67537b8a-afa3-4df6-9cef-c2cdfc34c053');
