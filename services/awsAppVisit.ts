
export const trackAppOpenAWS = async (uid: string) => {
  try {
    if (!uid) throw new Error("UID is required");

    const response = await fetch(
      "https://6i6xjgmxbb.execute-api.eu-north-1.amazonaws.com/app-open",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid }),
      }
    );

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();

    // data will be like:
    // {
    //   uid: "12345",
    //   dailyAppOpenCount: 2,
    //   firstOpenTime: "...",
    //   lastVisit: "...",
    //   updatedAt: "..."
    // }

    return data;
  } catch (error) {
    console.log("Error tracking app open via AWS:", error);
    return null;
  }
};