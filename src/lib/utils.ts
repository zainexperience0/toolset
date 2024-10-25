import { z } from "zod";
import { nanoid } from "nanoid";
import { fetchCaptions, fetchCaptionswithTime, fetchComments,  fetchMetadata } from "./youtube";

// Create a URL matching regex from patterns
const urlPatternRegex = (patterns: string[]) =>
  new RegExp(`^(${patterns.map((p) => p.replace(/\*/g, ".*")).join("|")})`);

const executeScriptInActiveTab = async (func: () => Promise<any>) => {
  const tab = await getActiveTab();
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func,
      world: "MAIN",
      args: [],
    });

    return {
      success: true,
      message: `Success`,
      result: result[0].result,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error}`,
      error,
    };
  }
};

export const getTabTools = async () => {
  const tab = await getActiveTab();
  const toolsForTab = toolSpecifications
    .flatMap(tool => validateUrl(tool.urlPattern, tab.url) ? tool.tools : []);

  if (toolsForTab.length === 0) {
    console.log("No tools found for the current tab");
    return [{
      message: "No tools found for the current tab"
    }];
  }
  return {
    message: `Found ${toolsForTab.length} tools for the current tab`,
    toolsForTab
  };
};

export const getActiveTab = async () => {
  try {
    const [activeTab]: any = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab?.url) {
      throw new Error("No active tab or URL found");
    }
    return activeTab;

  } catch (error) {
    console.error("An error occurred while executing the script", error);
    return {
      message: "An error occurred while executing the script",
    };
  }
};

function validateUrl(patterns: string[] | undefined, url: string): boolean {
  return patterns ? urlPatternRegex(patterns).test(url) : false;
}
// Tool specifications with Zod validation for parameters
export const toolSpecifications = [
  {
    id: nanoid(),
    name: "Youtube Tools",
    slug: "youtube-tools",
    urlPattern: ["https://www.youtube.com/*"],
    tools: [
      {
        id: nanoid(),
        name: "Getting Transcript",
        slug: "getting-transcript",
        description: "Download a video's transcript",
        parameters: z.object({
          parameter_test: z.string().describe("This is a test parameter"),
        }),
        execute: async () => {
          return await executeScriptInActiveTab(fetchCaptions);
        },
      },
      {
        id: nanoid(),
        name: "Getting YT Subtitles with time",
        slug: "yt-subtitle-with-time",
        description: "Get a video's subtitles with time",
        parameters: z.object({
          parameter_test: z.string().describe("This is a test parameter"),
        }),
        execute: async () => {
          return await executeScriptInActiveTab(fetchCaptionswithTime);
        },
      },
      {
        id: nanoid(),
        name: "Getting YT MetaData",
        slug: "yt-metadata",
        description: "Get a video's metadata",
        parameters: z.object({
          parameter_test: z.string().describe("This is a test parameter"),
        }),
        execute: async () => {
          return await executeScriptInActiveTab(fetchMetadata);
        },
      },
      {
        id: nanoid(),
        name: "Getting YT Comments",
        slug: "yt-comments",
        description: "Get a video's comments",
        parameters: z.object({
          parameter_test: z.string().describe("This is a test parameter"),
        }),
        execute: async () => {
          return await executeScriptInActiveTab(fetchComments);
        },
      },
    ],
  },
  {
    id: nanoid(),
    name: "Gmail Tools",
    slug: "gmail-tools",
    urlPattern: ["https://mail.google.com/*"],
    tools: [
      {
        id: nanoid(),
        name: "Reply Generator",
        slug: "reply-generator",
        description: "Generate a reply with the help of AI",
        parameters: z.object({
          parameter_test: z.string().describe("This is a test parameter"),
        }),
        execute: () => { },
      },
    ],
  },
];


export const formatTime = (timeInMs: number) => {
  const totalSeconds = Math.floor(timeInMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};