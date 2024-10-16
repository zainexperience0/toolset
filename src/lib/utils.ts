import { nanoid } from "nanoid";
import { z } from "zod";

// Validate URL against provided patterns
export function validateUrl(patterns: string[], url: string) {
  if (!url || !patterns) {
    console.warn("Either the URL or patterns are undefined or empty");
    return false;
  }

  const regexPattern = patterns.map((pattern) =>
    pattern.replace(/\*/g, ".*").replace(/[.+?^${}()|[\]\\]/g, "\\$&")
  );

  const regex = new RegExp(`^(${regexPattern.join("|")})`);
  return regex.test(url);
}

// Function to get current tab info
async function getCurrentTab() {
  const [currentTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return currentTab;
}

// Function to execute script in current tab
async function executeScriptInCurrentTab(func: any) {
  const { id: tabId, url }: any = await getCurrentTab();

  if (
    !tabId ||
    !validateUrl(
      toolSpecifications.find((tool: any) => tool.slug === "get_yt_sub")
        ?.urlPattern,
      url
    )
  ) {
    throw new Error("Opened website is not supported for getting YT subtitles");
  }

  return await chrome.scripting.executeScript({
    target: { tabId },
    func,
    world: "MAIN",
  });
}

// Function to fetch YouTube subtitles
export async function getYTSubtitles() {
  try {
    const result = await executeScriptInCurrentTab(async () => {
      async function scrapeYTSubtitles(langCode = "en") {
        const responseText = await (await fetch(window.location.href)).text();
        const captionsData = JSON.parse(
          responseText.split("ytInitialPlayerResponse = ")[1].split(";var")[0]
        );
        const captionTracks =
          captionsData.captions.playerCaptionsTracklistRenderer.captionTracks;

        const findCaptionUrl = (langCode: any) =>
          captionTracks.find((track: any) => track.vssId.startsWith(langCode))
            ?.baseUrl;

        let url =
          findCaptionUrl(`.${langCode}`) ||
          findCaptionUrl(".") ||
          findCaptionUrl(`a.${langCode}`) ||
          captionTracks[0].baseUrl;

        url += `&fmt=json3&tlang=${langCode}`;
        const captionEvents = (await (await fetch(url)).json()).events;

        return captionEvents.map((event: any) => ({
          ...event,
          text: (event.segs?.map((seg: any) => seg.utf8).join(" ") || "")
            .replace(/\n/g, " ")
            .replace(/'|"|\.{2,}|\<.*?\>|\{.*?\}|\[.*?\]/g, "")
            .replace(/[^\x00-\x7F]/g, "")
            .trim(),
        }));
      }

      const subtitles = await scrapeYTSubtitles();
      return subtitles.join(" ");
    });

    return result[0].result;
  } catch (error: any) {
    throw new Error(
      error.message || "An error occurred while fetching subtitles."
    );
  }
}

// Function to fetch video tags
export const getVideoTags = async () => {
  try {
    const result = await executeScriptInCurrentTab(async () => {
      const responseText = await (await fetch(window.location.href)).text();
      const captionsData = JSON.parse(
        responseText.split("ytInitialPlayerResponse = ")[1].split(";var")[0]
      );
      return captionsData.videoDetails.keywords;
    });

    return result[0].result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Function to fetch video metadata
export const getVideoMeta = async () => {
  try {
    const result = await executeScriptInCurrentTab(async () => {
      const responseText = await (await fetch(window.location.href)).text();
      const captionsData = JSON.parse(
        responseText.split("ytInitialPlayerResponse = ")[1].split(";var")[0]
      );
      console.log(captionsData.videoDetails);
      
      return captionsData.videoDetails;
    });

    return result[0].result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Tool specifications
export const toolSpecifications: any = [
  {
    id: nanoid(),
    name: "Get YT Subtitles",
    slug: "get_yt_sub",
    urlPattern: ["https://www.youtube.com/*"],
    tool: {
      description: "Get YouTube subtitles",
      parameters: z.object({
        parameter_test: z.string().describe("Zod validated parameters"),
      }),
      execute: getYTSubtitles,
    },
  },
  {
    id: nanoid(10),
    name: "Get video tags",
    slug: "get_video_tags",
    urlPattern: ["https://www.youtube.com/*"],
    description: "Get video tags",
    parameters: z.object({
      parameter_test: z.string().describe("Zod validated parameters"),
    }),
    execute: getVideoTags,
  },
  {
    id: nanoid(10),
    name: "Get video meta",
    slug: "get_video_meta",
    urlPattern: ["https://www.youtube.com/*"],
    description: "Get video metadata",
    parameters: z.object({
      parameter_test: z.string().describe("Zod validated parameters"),
    }),
    execute: getVideoMeta,
  },
];
