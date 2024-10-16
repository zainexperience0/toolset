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
export async function getYTSubtitles(toolSpecifications: any) {
  const [currentTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const tabId = currentTab.id;
  const url = currentTab.url;

  if (
    !tabId ||
    !validateUrl(
      toolSpecifications.find((tool: any) => tool.slug === "get_yt_sub")?.urlPattern,
      url
    )
  ) {
    throw new Error("Opened Website is not supported for getting YT Subtitles");
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
          captionTracks.find((track: any) => track.vssId.startsWith(langCode))?.baseUrl;

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

  return result[0].result;
}

export const toolSpecifications = [
  {
    id: nanoid(),
    name: "Get YT Subtitles", // keep name short in 2-3 words
    slug: "get_yt_sub",
    urlPattern: ["https://www.youtube.com/*"],
    // vercel ai sdk guided tool structure
    tool: {
      description: "Get YouTube subtitles",
      parameters: z.object({
        parameter_test: z.string().describe("Zod validated paramaters"), //this is just for testing, if there are no parameters, just leave it {}
      }),
      execute: () => {},
    },
  },
];
