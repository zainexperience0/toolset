import { toolSpecifications } from "../lib/utils";

type Tool = {
  id: string;
  name: string;
  slug: string;
  urlPattern: string[];
  tool: {
    description: string;
    parameters: unknown;
    execute: () => Promise<void>;
  };
};

const App = () => {
  const handleExecute = async (tool: Tool) => {
    try {
      if (typeof tool.tool.execute === "function") {
        const result = await tool.tool.execute();
        console.log(result);
        console.log(`${tool.name} executed successfully`);
      } else {
        console.warn(`No executable function found for ${tool.name}`);
      }
    } catch (error) {
      console.error(`Error executing ${tool.name}:`, error);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">YouTube Tools</h1>
      <div className="grid grid-cols-1 gap-4">
        {toolSpecifications.map((tool: any) => (
          <div key={tool.id}>
            <button
              onClick={() => handleExecute(tool)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring"
              aria-label={`Execute ${tool.name}`}
            >
              {tool.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
