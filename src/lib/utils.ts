import { z } from "zod";
import { nanoid } from "nanoid";

// Fetch the current active tab in the current window
const fetchCurrentTab = () =>
  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => tab);

// Execute script in the current active tab if the URL matches the pattern
export async function executeScriptInCurrentTab(
  func: () => void,
  slug: string
) {
  const tab = await fetchCurrentTab();
  const tool = toolSpecifications.find((tool) => tool.slug === slug);

  if (!(tab?.id && tool && validateUrl(tool.urlPattern, tab.url))) {
    return {
      status: false,
      data: "Opened website is not supported for getting YouTube subtitles",
    };
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func,
    });

    return {
      status: true,
      data: result?.result || null,
    };
  } catch (error: any) {
    console.error("Script execution failed", error);
    return { status: false, data: error.message };
  }
}

// Function to get YouTube transcript
export const getYTTranscript = async () => {
  try {
    return await executeScriptInCurrentTab(async () => {
      const fetchCaptions = async (langCode = "en") => {
        try {
          const response = await fetch(window.location.href);
          const responseText = await response.text();

          const ytInitialPlayerResponse = responseText
            .split("ytInitialPlayerResponse = ")[1]
            ?.split(";var")[0];

          if (!ytInitialPlayerResponse)
            throw new Error("Player response not found");

          const { captions } = JSON.parse(ytInitialPlayerResponse) || {};
          const captionTracks =
            captions?.playerCaptionsTracklistRenderer?.captionTracks;

          if (!captionTracks) throw new Error("No caption tracks found");

          const findCaptionUrl = (langCode: string) =>
            captionTracks.find((track: any) => track.vssId.startsWith(langCode))
              ?.baseUrl;

          const url =
            findCaptionUrl(`.${langCode}`) ||
            findCaptionUrl(".") ||
            captionTracks[0]?.baseUrl;
          if (!url) throw new Error("Caption URL not found");

          const captionResponse = await fetch(
            `${url}&fmt=json3&tlang=${langCode}`
          );
          const captionData = await captionResponse.json();

          const data = captionData?.events.map((event: any) => ({
            ...event,
            text: (event.segs?.map((seg: any) => seg.utf8).join(" ") || "") // Join all the segments
              .replace(/\n/g, " ") // Remove newlines
              .replace(/'|"|\.{2,}|\<.*?\>|\{.*?\}|\[.*?\]/g, "") // Remove special characters
              .replace(/[^\x00-\x7F]/g, "") // Remove non-UTF-8 characters (anything outside ASCII range)
              .trim(), // Trim the text
          }));
          return data.map((x: any) => x.text).join("") || [];
        } catch (error) {
          console.error("Error fetching captions:", error);
          return [];
        }
      };

      return await fetchCaptions();
    }, "get_yt_subtitles");
  } catch (error: any) {
    console.error("Failed to execute script", error);
    return { status: false, data: error.message };
  }
};

export const getYTSubtitlewithTime = async () => {
  try {
    return await executeScriptInCurrentTab(async () => {
      const fetchCaptions = async (langCode = "en") => {
        try {
          const response = await fetch(window.location.href);
          const responseText = await response.text();

          const ytInitialPlayerResponse = responseText
            .split("ytInitialPlayerResponse = ")[1]
            ?.split(";var")[0];

          if (!ytInitialPlayerResponse)
            throw new Error("Player response not found");

          const { captions } = JSON.parse(ytInitialPlayerResponse) || {};
          const captionTracks =
            captions?.playerCaptionsTracklistRenderer?.captionTracks;

          if (!captionTracks) throw new Error("No caption tracks found");

          const findCaptionUrl = (langCode: string) =>
            captionTracks.find((track: any) => track.vssId.startsWith(langCode))
              ?.baseUrl;

          const url =
            findCaptionUrl(`.${langCode}`) ||
            findCaptionUrl(".") ||
            captionTracks[0]?.baseUrl;
          if (!url) throw new Error("Caption URL not found");

          const captionResponse = await fetch(
            `${url}&fmt=json3&tlang=${langCode}`
          );
          const captionData = await captionResponse.json();

          return (
            captionData?.events.map((x: any) => ({
              text: x.segs?.map((x: any) => x.utf8).join(" "),
              time: x.tStartMs,
            })) || []
          );
        } catch (error) {
          console.error("Error fetching captions:", error);
          return [];
        }
      };

      return await fetchCaptions();
    }, "get_yt_tools_with_time");
  } catch (error: any) {
    console.error("Failed to execute script", error);
    return { status: false, data: error.message };
  }
};

export const getVideoMetadata = async () => {
  try {
    return await executeScriptInCurrentTab(async () => {
      const fetchCaptions = async (langCode = "en") => {
        try {
          let responseText = await (await fetch(window.location.href)).text();

          const captionsData = JSON.parse(
            responseText.split("ytInitialPlayerResponse = ")[1].split(";var")[0]
          );
          return captionsData.videoDetails;
        } catch (error) {
          console.error("Error fetching captions:", error);
          return [];
        }
      };

      return await fetchCaptions();
    }, "get_yt_video_metadata");
  } catch (error: any) {
    console.error("Failed to execute script", error);
    return { status: false, data: error.message };
  }
};
// Precompile URL pattern regex for efficiency
const urlPatternRegex = (patterns: string[]) =>
  new RegExp(`^(${patterns.map((p) => p.replace(/\*/g, ".*")).join("|")})`);

// Validate URL patterns against the current tab's URL
export function validateUrl(
  patterns: string[] | undefined,
  url: string | undefined
): boolean {
  if (!url || !patterns) return false;
  return urlPatternRegex(patterns).test(url);
}

// Tool specifications with Zod validation for parameters
export const toolSpecifications = [
  {
    id: nanoid(),
    name: "Get YT Subtitles",
    slug: "get_yt_subtitles",
    urlPattern: ["https://www.youtube.com/*"],
    tool: {
      description: "Get YouTube subtitles",
      parameters: z.object({
        parameter_test: z.string().describe("Zod validated parameters"),
      }),
      execute: getYTTranscript,
    },
  },
  {
    id: nanoid(),
    name: "Get YT Subtitles with Time",
    slug: "get_yt_tools_with_time",
    urlPattern: ["https://www.youtube.com/*"],
    tool: {
      description: "Get YouTube subtitles with time",
      parameters: z.object({
        parameter_test: z.string().describe("Zod validated parameters"),
      }),
      execute: getYTSubtitlewithTime,
    },
  },
  {
    id: nanoid(),
    name: "Get YT Video Metadata",
    slug: "get_yt_video_metadata",
    urlPattern: ["https://www.youtube.com/*"],
    tool: {
      description: "Get YouTube video metadata",
      parameters: z.object({
        parameter_test: z.string().describe("Zod validated parameters"),
      }),
      execute: getVideoMetadata,
    },
  },
];

const formatTime = (timeInMs: number) => {
  const totalSeconds = Math.floor(timeInMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};
