import os
from typing import Any, Protocol

import httpx
from pydantic import BaseModel


class LearningContextSettings(BaseModel):
    internal_api_secret: str = "sagelms-dev-internal-secret"
    course_service_url: str = "http://course-service:8082"
    content_service_url: str = "http://content-service:8083"
    assessment_service_url: str = "http://assessment-service:8085"
    challenge_service_url: str = "http://challenge-service:8086"
    max_chars: int = 12000
    timeout_seconds: float = 5.0

    @classmethod
    def from_env(cls) -> "LearningContextSettings":
        return cls(
            internal_api_secret=os.getenv("INTERNAL_API_SECRET", "sagelms-dev-internal-secret").strip(),
            course_service_url=_service_url("COURSE_SERVICE", "course-service", "8082"),
            content_service_url=_service_url("CONTENT_SERVICE", "content-service", "8083"),
            assessment_service_url=_service_url("ASSESSMENT_SERVICE", "assessment-service", "8085"),
            challenge_service_url=_service_url("CHALLENGE_SERVICE", "challenge-service", "8086"),
            max_chars=int(os.getenv("AI_TUTOR_CONTEXT_MAX_CHARS", "12000")),
            timeout_seconds=float(os.getenv("AI_TUTOR_CONTEXT_TIMEOUT_SECONDS", "5.0")),
        )


class ChatPayloadLike(Protocol):
    course_id: str | None
    challenge_id: str | None


class UserContextLike(Protocol):
    user_id: str
    roles: str


class LearningContextError(Exception):
    pass


class LearningContextForbiddenError(LearningContextError):
    pass


class LearningContextNotFoundError(LearningContextError):
    pass


class LearningContextRequestError(LearningContextError):
    pass


def _service_url(prefix: str, default_host: str, default_port: str) -> str:
    explicit_url = os.getenv(f"{prefix}_URL", "").strip()
    if explicit_url:
        return explicit_url.rstrip("/")
    host = os.getenv(f"{prefix}_HOST", default_host).strip() or default_host
    port = os.getenv(f"{prefix}_PORT", default_port).strip() or default_port
    return f"http://{host}:{port}"


def load_learning_context(
    payload: ChatPayloadLike,
    user: UserContextLike,
    settings: LearningContextSettings | None = None,
) -> str | None:
    if not payload.course_id and not payload.challenge_id:
        return None

    context_settings = settings or LearningContextSettings.from_env()
    headers = {"X-Internal-Secret": context_settings.internal_api_secret}
    params = {"userId": user.user_id, "roles": user.roles or ""}

    with httpx.Client(timeout=context_settings.timeout_seconds, headers=headers) as client:
        if payload.course_id:
            course = _get_json(
                client,
                f"{context_settings.course_service_url}/internal/courses/{payload.course_id}/ai-context",
                params,
            )
            lessons = _get_json(
                client,
                f"{context_settings.content_service_url}/internal/courses/{payload.course_id}/ai-context/lessons",
                params,
            )
            assessments = _get_json(
                client,
                f"{context_settings.assessment_service_url}/internal/courses/{payload.course_id}/ai-context/assessments",
                params,
            )
            return _truncate(_format_course_context(course, lessons, assessments), context_settings.max_chars)

        challenge = _get_json(
            client,
            f"{context_settings.challenge_service_url}/internal/challenges/{payload.challenge_id}/ai-context",
            params,
        )
        return _truncate(_format_challenge_context(challenge), context_settings.max_chars)


def _get_json(client: httpx.Client, url: str, params: dict[str, str]) -> Any:
    try:
        response = client.get(url, params=params)
    except httpx.HTTPError as exc:
        raise LearningContextRequestError(str(exc)) from exc

    if response.status_code == 403:
        raise LearningContextForbiddenError("User cannot access this learning context.")
    if response.status_code == 404:
        raise LearningContextNotFoundError("Learning context not found.")
    if response.status_code >= 400:
        raise LearningContextRequestError(f"Context service returned HTTP {response.status_code}.")
    return response.json()


def _format_course_context(course: dict[str, Any], lessons: list[dict[str, Any]], assessments: list[dict[str, Any]]) -> str:
    lines = [
        "# Course Context",
        f"- Course: {_text(course.get('title'))}",
        f"- Description: {_text(course.get('description'))}",
        f"- Category: {_text(course.get('category'))}",
        f"- Status: {_text(course.get('status'))}",
        f"- Instructor: {_text(course.get('instructorFullName') or course.get('instructorEmail') or course.get('instructorId'))}",
        "",
        "## Lessons",
    ]
    if lessons:
        for lesson in sorted(lessons, key=lambda item: item.get("sortOrder") or 0):
            lines.extend(_format_lesson(lesson))
    else:
        lines.append("- No visible lessons.")

    lines.append("")
    lines.append("## Assessments")
    if assessments:
        for item in assessments:
            lines.extend(_format_assessment(item))
    else:
        lines.append("- No visible assessments.")
    return "\n".join(lines)


def _format_challenge_context(payload: dict[str, Any]) -> str:
    challenge = payload.get("challenge") or {}
    lines = [
        "# Challenge Context",
        f"- Challenge: {_text(challenge.get('title'))}",
        f"- Description: {_text(challenge.get('description'))}",
        f"- Category: {_text(challenge.get('category'))}",
        f"- Status: {_text(challenge.get('status'))}",
        "",
        "## Question Sets",
    ]
    question_sets = payload.get("questionSets") or []
    if not question_sets:
        lines.append("- No visible question sets.")
    for item in question_sets:
        question_set = item.get("questionSet") or {}
        lines.extend(_format_question_set(question_set, item.get("questions") or []))
    return "\n".join(lines)


def _format_lesson(lesson: dict[str, Any]) -> list[str]:
    lines = [
        f"- Lesson {_text(lesson.get('sortOrder'))}: {_text(lesson.get('title'))}",
        f"  - Type: {_text(lesson.get('type'))}",
    ]
    if lesson.get("durationMinutes"):
        lines.append(f"  - Duration: {lesson.get('durationMinutes')} minutes")
    if lesson.get("contentUrl"):
        lines.append(f"  - URL: {lesson.get('contentUrl')}")
    if lesson.get("textContent"):
        lines.append(f"  - Text: {_compact(lesson.get('textContent'), 1200)}")
    return lines


def _format_assessment(item: dict[str, Any]) -> list[str]:
    assessment = item.get("assessment") or {}
    lines = [
        f"- Assessment: {_text(assessment.get('title'))}",
        f"  - Description: {_text(assessment.get('description'))}",
        f"  - Status: {_text(assessment.get('status'))}",
    ]
    for question_set_item in item.get("questionSets") or []:
        lines.extend("  " + line for line in _format_question_set(
            question_set_item.get("questionSet") or {},
            question_set_item.get("questions") or [],
        ))
    return lines


def _format_question_set(question_set: dict[str, Any], questions: list[dict[str, Any]]) -> list[str]:
    lines = [
        f"- Question set: {_text(question_set.get('title'))}",
        f"  - Time limit: {_format_time_limit(question_set.get('timeLimitMinutes'))}",
        f"  - Questions: {len(questions)}",
    ]
    for index, question in enumerate(sorted(questions, key=lambda item: item.get("sortOrder") or 0), start=1):
        lines.extend(_format_question(index, question))
    return lines


def _format_question(index: int, question: dict[str, Any]) -> list[str]:
    lines = [
        f"  - Q{index}: {_compact(question.get('prompt') or question.get('title'), 600)}",
        f"    - Type: {_text(question.get('type'))}; Points: {_text(question.get('points'))}",
    ]
    if question.get("mediaUrl"):
        lines.append(f"    - Media: {_text(question.get('mediaType'))} {question.get('mediaUrl')}")
    choices = question.get("choices") or []
    if choices:
        lines.append("    - Choices:")
        for choice_index, choice in enumerate(sorted(choices, key=lambda item: item.get("sortOrder") or 0), start=1):
            marker = " (correct)" if choice.get("isCorrect") is True else ""
            lines.append(f"      {choice_index}. {_text(choice.get('text'))}{marker}")
    return lines


def _format_time_limit(minutes: Any) -> str:
    if isinstance(minutes, int) and minutes > 0:
        return f"{minutes} minutes"
    return "No limit"


def _text(value: Any) -> str:
    if value is None or value == "":
        return "N/A"
    return str(value)


def _compact(value: Any, limit: int) -> str:
    text = " ".join(_text(value).split())
    if len(text) <= limit:
        return text
    return text[: limit - 3].rstrip() + "..."


def _truncate(text: str, max_chars: int) -> str:
    if max_chars <= 0 or len(text) <= max_chars:
        return text
    return text[: max_chars - 80].rstrip() + "\n\n[Context truncated because it exceeded the configured limit.]"
