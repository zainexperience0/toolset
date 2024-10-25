export const fetchCaptionswithTime = async (langCode: string = "en"): Promise<Array<{ text: string; time: number }>> => {
  try {
    let responseText = await (await fetch(window.location.href)).text();

    const captionsData = JSON.parse(
      responseText.split("ytInitialPlayerResponse = ")[1].split(";var")[0]
    );

    const captionTracks = captionsData.captions.playerCaptionsTracklistRenderer?.captionTracks;

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
    let responseText = await (await fetch(window.location.href)).text();

    const captionsData = JSON.parse(
      responseText.split("ytInitialPlayerResponse = ")[1].split(";var")[0]
    );

    const captionTracks = captionsData.captions.playerCaptionsTracklistRenderer?.captionTracks;

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

    const totalComments = document.querySelector('yt-formatted-string.count-text.style-scope.ytd-comments-header-renderer')?.textContent
    const total_likes = document.querySelector('.YtLikeButtonViewModelHost')?.textContent
    const timeAgo = document.querySelector('yt-formatted-string#info :nth-of-type(3)')?.textContent
    return [
      {
        author: captionsData.videoDetails.author,
        channelId: captionsData.videoDetails.channelId,
        keywords: captionsData.videoDetails.keywords,
        lengthSeconds: captionsData.videoDetails.lengthSeconds,
        title: captionsData.videoDetails.title,
        videoId: captionsData.videoDetails.videoId,
        viewCount: captionsData.videoDetails.viewCount,
        totalComments: totalComments ? parseInt(totalComments) : "No comments",
        total_likes: total_likes ? parseInt(total_likes) : "No likes",
        timeAgo: timeAgo ? timeAgo : "No timeAgo",
        shortDescription: captionsData.videoDetails.shortDescription,
      }
    ]
  } catch (error) {

    console.error("Error fetching captions:", error);
    return [];
  }
};

export const fetchComments = async () => {
  try {
    const comments: any = [];
    const totalComments_0 = parseInt(
      document.querySelector('yt-formatted-string.count-text.style-scope.ytd-comments-header-renderer')?.textContent?.replace(/[^0-9]/g, '') || '0'
    );

    // Crawl button setup
    const crawlButton = document.createElement('button');
    crawlButton.setAttribute('id', 'btn-crawl-comments');
    crawlButton.innerText = '⏬ Crawl Comments';
    crawlButton.title = 'Crawl comments';
    crawlButton.style.position = 'fixed';
    crawlButton.style.bottom = '0px';
    crawlButton.style.left = '0px';
    crawlButton.style.opacity = '0.8';
    crawlButton.style.zIndex = '9999';
    crawlButton.style.background = 'red';
    crawlButton.style.color = 'white';
    crawlButton.style.border = '1px solid black';
    crawlButton.style.borderRadius = '2px';
    crawlButton.style.padding = '4px 4px';
    crawlButton.style.cursor = 'pointer';
    crawlButton.style.fontSize = '1.5em';
    crawlButton.style.transition = 'background 0.2s ease-in-out';

    // Download button setup
    const downloadButton = document.createElement('button');
    downloadButton.setAttribute('id', 'btn-download-comments');
    downloadButton.innerText = '⬇️ Download CSV';
    downloadButton.title = 'Download comments as CSV';
    downloadButton.style.position = 'fixed';
    downloadButton.style.bottom = '0px';
    downloadButton.style.left = '140px';
    downloadButton.style.opacity = '0.8';
    downloadButton.style.zIndex = '9999';
    downloadButton.style.background = 'green';
    downloadButton.style.color = 'white';
    downloadButton.style.border = '1px solid black';
    downloadButton.style.borderRadius = '2px';
    downloadButton.style.padding = '4px 4px';
    downloadButton.style.cursor = 'pointer';
    downloadButton.style.fontSize = '1.5em';
    downloadButton.style.transition = 'background 0.2s ease-in-out';

    // Append buttons to document
    document.body.appendChild(crawlButton);
    document.body.appendChild(downloadButton);

    // Crawl comments function
    const crawlComments = async () => {
      crawlButton.innerText = '⏳ Crawling...';
      crawlButton.title = 'Crawling...';

      // Scroll and fetch comments until the count matches totalComments_0
      let lastHeight = 0;
      while (comments.length < totalComments_0) {
        window.scrollTo(0, document.documentElement.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newHeight = document.documentElement.scrollHeight;
        if (newHeight === lastHeight) {
          break;
        }
        lastHeight = newHeight;

        const commentElements = document.querySelectorAll('#contents #content-text');
        comments.length = 0; // Reset comments array to avoid duplicates
        for (const commentElement of commentElements) {
          const comment = {
            text: commentElement?.textContent?.trim().replace(/\n/g, ' ').replace(/"/g, '""').replace(/'/g, "''"),
            author: commentElement?.closest('#comment')?.querySelector('#author-text')?.textContent?.trim().replace(/"/g, '""').replace(/'/g, "''"),
            likes: commentElement?.closest('#comment')?.querySelector('#vote-count-middle')?.textContent?.trim().replace(/"/g, '""').replace(/'/g, "''"),
          };
          comments.push(comment);
        }
        console.log(`Fetched ${comments.length} of ${totalComments_0} comments...`);
      }

      crawlButton.innerText = '🔃 Crawl Again';
      crawlButton.title = 'Crawl comments again';
    };

    // Function to download comments as CSV
    const downloadCommentsCSV = () => {
      if (comments.length === 0) {
        alert("No comments to download. Please crawl comments first.");
        return;
      }

      const headers = ['Text', 'Author', 'Likes'];
      const rows = comments.map((comment: any) => [comment.text, comment.author, comment.likes]);
      const csv = [headers, ...rows].map(row => row.map((value: any) => `"${value}"`).join(',')).join('\n');

      // Create a Blob from the CSV string
      const blob = new Blob([csv], { type: 'text/csv' });

      // Create a link element to download the CSV file
      const link = document.createElement('a');
      const fileName = `yt-comments-${new Date().toISOString().slice(0, 10)}-${new Date().getTime()}-${comments.length}`;
      link.download = `${fileName}.csv`;
      link.href = URL.createObjectURL(blob);

      // Click the link to download the CSV file
      link.click();
    };

    // Event listeners
    crawlButton.addEventListener('click', crawlComments);
    downloadButton.addEventListener('click', downloadCommentsCSV);
    return comments
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};


