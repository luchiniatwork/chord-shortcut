// background.js -- Service worker for Chord Shortcut extension

chrome.commands.onCommand.addListener(async (command) => {
  console.log("[chord] command received:", command);
  if (command !== "activate-chord") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("[chord] active tab:", tab?.id, tab?.url?.slice(0, 60));

  if (!tab?.id) {
    console.log("[chord] no active tab found");
    return;
  }

  if (tab.url?.startsWith("chrome://") || tab.url?.startsWith("edge://")) {
    console.log("[chord] skipping — chrome:// or edge:// page");
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { action: "activate-chord" });
    console.log("[chord] message sent to content script");
  } catch (err) {
    console.log("[chord] sendMessage failed, injecting content script:", err.message);
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
      // Small delay to let the content script register its listener
      await new Promise((r) => setTimeout(r, 50));
      await chrome.tabs.sendMessage(tab.id, { action: "activate-chord" });
      console.log("[chord] injected and message sent");
    } catch (err2) {
      console.log("[chord] injection failed:", err2.message);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action !== "navigate") return;

  const { url, openInNewTab } = message;
  if (!url) return;

  console.log("[chord] navigating:", url, openInNewTab ? "(new tab)" : "(current tab)");

  if (openInNewTab) {
    chrome.tabs.create({ url });
  } else {
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.tabs.update(tabId, { url });
    } else {
      chrome.tabs.create({ url });
    }
  }
});
