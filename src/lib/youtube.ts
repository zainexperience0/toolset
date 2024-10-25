export const fetchCaptionswithTime = async (langCode: string = "en"): Promise<Array<{ text: string; time: number }>> => {
  try {
    const response = await fetch(window.location.href);
    const responseText = await response.text();
    const ytInitialPlayerResponse = responseText
      .split("ytInitialPlayerResponse = ")[1]
      ?.split(";var")[0];

    const { captions } = JSON.parse(ytInitialPlayerResponse) || {};
    const captionTracks = captions?.playerCaptionsTracklistRenderer?.captionTracks;

    const findCaptionUrl = (lang: string) =>
      captionTracks.find((track: any) => track.vssId.startsWith(lang))?.baseUrl;

    const url = findCaptionUrl(`.${langCode}`) || findCaptionUrl(".") || captionTracks[0]?.baseUrl;

    if (!url) {
      throw new Error("No caption URL found");
    }

    const captionResponse = await fetch(`${url}&fmt=json3&tlang=${langCode}`);
    const captionData = await captionResponse.json();

    const data = captionData?.events.map((x: any) => ({
      text: x.segs?.map((x: any) => x.utf8).join(" "),
      time: x.tStartMs,
    })) || []
    return data || [];
  } catch (error) {

    console.error("Error fetching captions:", error);
    return [];
  }
};

export const fetchCaptions = async (langCode: string = "en"): Promise<string[]> => {
  try {
    const response = await fetch(window.location.href);
    const responseText = await response.text();
    const ytInitialPlayerResponse = responseText
      .split("ytInitialPlayerResponse = ")[1]
      ?.split(";var")[0];

    const { captions } = JSON.parse(ytInitialPlayerResponse) || {};
    const captionTracks = captions?.playerCaptionsTracklistRenderer?.captionTracks;

    const findCaptionUrl = (lang: string) =>
      captionTracks.find((track: any) => track.vssId.startsWith(lang))?.baseUrl;

    const url = findCaptionUrl(`.${langCode}`) || findCaptionUrl(".") || captionTracks[0]?.baseUrl;

    if (!url) {
      throw new Error("No caption URL found");
    }

    const captionResponse = await fetch(`${url}&fmt=json3&tlang=${langCode}`);
    const captionData = await captionResponse.json();

    const data = captionData?.events.map((event: any) => ({
      text: (event.segs?.map((seg: any) => seg.utf8).join(" ") || "") // Join all the segments
        .replace(/\n/g, " ") // Remove newlines
        .replace(/'|"|\.{2,}|\<.*?\>|\{.*?\}|\[.*?\]/g, "") // Remove special characters
        .replace(/[^\x00-\x7F]/g, "") // Remove non-UTF-8 characters (anything outside ASCII range)
        .trim(),
      time: event.tStartMs,
    }));
    return data.map((x: any) => x.text).join("") || [];;
  } catch (error) {

    console.error("Error fetching captions:", error);
    return [];
  }
};

//fetch metaData
export const fetchMetadata = async (langCode: string = "en"): Promise<any[]> => {
  try {
    let responseText = await (await fetch(window.location.href)).text();

    const captionsData = JSON.parse(
      responseText.split("ytInitialPlayerResponse = ")[1].split(";var")[0]
    );

    return [
      {
        author: captionsData.videoDetails.author,
        channelId: captionsData.videoDetails.channelId,
        keywords: captionsData.videoDetails.keywords,
        lengthSeconds: captionsData.videoDetails.lengthSeconds,
        title: captionsData.videoDetails.title,
        videoId: captionsData.videoDetails.videoId,
        viewCount: captionsData.videoDetails.viewCount
      }
    ]
  } catch (error) {

    console.error("Error fetching captions:", error);
    return [];
  }
};