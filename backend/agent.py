import os
from pathlib import Path
from anthropic import Anthropic
from twilio.rest import Client

anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

twilio_client = Client(
    os.getenv("TWILIO_ACCOUNT_SID"),
    os.getenv("TWILIO_AUTH_TOKEN"),
)
TWILIO_FROM = os.getenv("TWILIO_PHONE_NUMBER")

# Load resource directory at startup
_resources_path = Path(__file__).parent / "data" / "programs.txt"
RESOURCES = _resources_path.read_text() if _resources_path.exists() else ""

# Keyed by phone number
conversation_history: dict[str, list[dict]] = {}

SYSTEM_PROMPT = f"""You are a helpful patient care coordinator from a medical clinic in Nashville, TN.
A patient has an upcoming appointment and may need support attending.

Your job is to:
1. Send a warm, brief appointment reminder
2. Mention 1-2 specific resources from the directory below that are most relevant to the patient's situation
3. Answer any follow-up questions they have — you may reference the full directory to help them
4. Keep messages concise — this is WhatsApp, so aim for under 300 characters per message

Never share private medical details. Always be empathetic and respectful.
If unsure about a resource, direct them to call 2-1-1 Tennessee for guidance.

--- NASHVILLE RESOURCE DIRECTORY ---
{RESOURCES}
--- END DIRECTORY ---"""


def send_message(to: str, body: str):
    message = twilio_client.messages.create(
        body=body,
        from_=f"whatsapp:{TWILIO_FROM}",
        to=f"whatsapp:{to}",
    )
    return message.sid


def initiate_outreach(
    phone: str,
    patient_name: str,
    appointment_date: str,
    patient_flags: list[str],
) -> str:
    flags_str = ", ".join(patient_flags) if patient_flags else "none noted"

    initial_user_message = (
        f"Patient first name: {patient_name.split()[0]}\n"
        f"Appointment date: {appointment_date}\n"
        f"Patient flags: {flags_str}\n\n"
        "Send the patient a WhatsApp message reminding them of their appointment "
        "and offering the 1-2 most relevant resources based on their flags."
    )

    conversation_history[phone] = [{"role": "user", "content": initial_user_message}]

    response = anthropic.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        system=SYSTEM_PROMPT,
        messages=conversation_history[phone],
    )

    agent_reply = response.content[0].text
    conversation_history[phone].append({"role": "assistant", "content": agent_reply})

    send_message(phone, agent_reply)
    return agent_reply


def handle_reply(phone: str, patient_message: str) -> str:
    # Normalize key — strip whatsapp: prefix if present
    phone = phone.replace("whatsapp:", "")
    if phone not in conversation_history:
        conversation_history[phone] = []

    conversation_history[phone].append({"role": "user", "content": patient_message})

    response = anthropic.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        system=SYSTEM_PROMPT,
        messages=conversation_history[phone],
    )

    agent_reply = response.content[0].text
    conversation_history[phone].append({"role": "assistant", "content": agent_reply})

    send_message(phone, agent_reply)
    return agent_reply
