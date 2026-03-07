type PublishOptions = {
  qos?: 0 | 1 | 2;
};

type MqttClientLike = {
  publish: (topic: string, message: string, options?: PublishOptions) => void;
};

const REQUEST_TOPIC = "raspberrypi/request";
let mqttClient: MqttClientLike | null = null;
const pendingMessages: { topic: string; payload: string }[] = [];
const MAX_PENDING_MESSAGES = 25;

export const setAwsIotClient = (client: MqttClientLike) => {
  mqttClient = client;
  flushPendingPublishes();
};

export const publishGetDataRequest = (trigger: "app_open" | "refresh" | "dashboard_visit") => {
  const payload = JSON.stringify({
    action: "getdata",
    trigger,
    requestedAt: new Date().toISOString(),
  });

  if (!mqttClient) {
    queuePendingPublish(REQUEST_TOPIC, payload);
    console.warn("AWS IoT MQTT client is not ready. Message queued.");
    return false;
  }

  try {
    mqttClient.publish(REQUEST_TOPIC, payload, { qos: 0 });
    return true;
  } catch (error) {
    console.error("Failed to publish MQTT request:", error);
    return false;
  }
};

const queuePendingPublish = (topic: string, payload: string) => {
  if (pendingMessages.length >= MAX_PENDING_MESSAGES) {
    pendingMessages.shift();
  }
  pendingMessages.push({ topic, payload });
};

const flushPendingPublishes = () => {
  if (!mqttClient || pendingMessages.length === 0) return;

  while (pendingMessages.length > 0) {
    const next = pendingMessages.shift();
    if (!next) break;

    try {
      mqttClient.publish(next.topic, next.payload, { qos: 0 });
    } catch (error) {
      console.error("Failed to flush queued MQTT message:", error);
      queuePendingPublish(next.topic, next.payload);
      break;
    }
  }
};
