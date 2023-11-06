chrome.downloads.onCreated.addListener(downloadItem => {
    chrome.downloads.cancel(downloadItem.id);

    if (!downloadItem.url.endsWith('.mov')) {
        fetch(downloadItem.url)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Errore nella richiesta HTTP: " + response.status);
                }

                const contentDisposition = response.headers.get("Content-Disposition");

                if (contentDisposition) {
                    const match = contentDisposition.match(/filename=([^;]*)/);
                    if (match) {
                        if (decodeURIComponent(match[1]).endsWith('.mov')) {
                            chrome.tabs.create({
                                url: "player.html#" + downloadItem.url,
                            });
                        }
                    }
                }
            })
            .catch(error => {
                console.error("Si è verificato un errore durante la richiesta HTTP:", error);
            });
    } else {
        chrome.tabs.create({
            url: "player.html#" + downloadItem.url,
        });
    }
});

