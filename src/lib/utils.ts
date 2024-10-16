import { nanoid } from "nanoid";
import { z } from "zod";

export function validateUrl(
  patterns: Array<string> | undefined,
  url: string | undefined
): boolean {
  // Log the input values
  console.log("Received patterns:", patterns);
  console.log("Received url:", url);

  if (!url || !patterns) {
    console.log("Either the url or patterns is undefined or empty");
    return false;
  }

  // Escape special characters in the patterns for regex
  const regexPattern = patterns?.map((pattern) => {
    const escapedPattern = pattern
      .replace(/\*/g, ".*")
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    console.log("Escaped pattern:", escapedPattern);
    return escapedPattern;
  });

  // Log the generated regex
  const regex = new RegExp(`^(${regexPattern.join("|")})`);
  console.log("Generated regex:", regex);

  // Test the URL against the regex and log the result
  const result = regex.test(url);
  console.log("Regex test result:", result);

  return result;
}

// Function to fetch YouTube subtitles
export async function getYTSubtitles() {
  try {
    const [currentTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const tabId = currentTab.id;
    const url = currentTab.url;

    if (
      !tabId ||
      !validateUrl(
        toolSpecifications.find((tool) => tool.slug === "get_yt_sub")
          ?.urlPattern,
        url
      )
    ) {
      throw new Error(
        "Opened Website is not supported for getting YT Subtitles"
      );
    }

    // Inject script to fetch subtitles
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: async () => {
        async function scrapeYTsubtitles(langCode = "en") {
          const responseText = await (await fetch(window.location.href)).text();
          const captionsData = JSON.parse(
            responseText.split("ytInitialPlayerResponse = ")[1].split(";var")[0]
          );
          const captionTracks =
            captionsData.captions.playerCaptionsTracklistRenderer.captionTracks;

          const findCaptionUrl = (langCode = "en") =>
            captionTracks.find((track: any) => track.vssId.startsWith(langCode))
              ?.baseUrl;

          let url =
            findCaptionUrl("." + langCode) ||
            findCaptionUrl(".") ||
            findCaptionUrl("a." + langCode) ||
            captionTracks[0].baseUrl;

          url += "&fmt=json3&tlang=" + langCode;
          const captionEvents = (await (await fetch(url)).json()).events;

          return captionEvents
            .map((event: any) => ({
              ...event,
              text: event.segs?.map((seg: any) => seg.utf8).join(" ") || "",
            }))
            .map((event: any) =>
              event.text
                .replace(/\n/g, " ")
                .replace(/'|"|\.{2,}|\<.*?\>|\{.*?\}|\[.*?\]/g, "")
                .replace(/[^\x00-\x7F]/g, "")
                .trim()
            );
        }

        const subtitles = await scrapeYTsubtitles();
        return subtitles.join(" ");
      },
      world: "MAIN",
    });

    const scrapedSubs = result[0].result;
    return scrapedSubs;
  } catch (error: any) {
    throw new Error(
      error.message || "An error occurred while fetching subtitles."
    );
  }
}

export const getVideoTags = async () => {
  try {
    const [currentTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const tabId = currentTab.id;
    const url = currentTab.url;

    if (
      !tabId ||
      !validateUrl(
        toolSpecifications.find((tool) => tool.slug === "get_yt_sub")
          ?.urlPattern,
        url
      )
    ) {
      throw new Error(
        "Opened Website is not supported for getting YT Subtitles"
      );
    }
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: async () => {
        async function scrapeTags() {
          const responseText = await (await fetch(window.location.href)).text();
          const captionsData = JSON.parse(
            responseText.split("ytInitialPlayerResponse = ")[1].split(";var")[0]
          );
          return captionsData.videoDetails.keywords;
        }

        const tags = await scrapeTags();
        return tags;
      },
      world: "MAIN",
    });

    const scrapedTags = result[0].result;
    return scrapedTags;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const toolSpecifications = [
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
      execute: getYTSubtitles, // mapped function to be executed
    },
  },
  {
    id: nanoid(10),
    name: "Get video tags",
    slug: "get_video_tags",
    urlPattern: ["https://www.youtube.com/*"],
    description: "Get video subtitles",
    parameters: z.object({
      parameter_test: z.string().describe("Zod validated parameters"),
    }),
    execute: getYTSubtitles, // mapped function to be executed
  },
];
