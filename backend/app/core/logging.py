import logging
import sys
import re

SENSITIVE_PATTERNS = [
    re.compile(r"(bearer\s+)[a-zA-Z0-9_\-\.]+", re.IGNORECASE),
    re.compile(r"(key[=:\s]+)[a-zA-Z0-9_\-]+", re.IGNORECASE),
    re.compile(r"(password[=:\s]+)[^\s&]+", re.IGNORECASE),
    re.compile(r"(token[=:\s]+)[a-zA-Z0-9_\-\.]+", re.IGNORECASE),
]


class SensitiveFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            for pattern in SENSITIVE_PATTERNS:
                record.msg = pattern.sub(r"\1[REDACTED]", record.msg)
        return True


def setup_logging(debug: bool = False) -> logging.Logger:
    logger = logging.getLogger("researchbridge")
    logger.setLevel(logging.DEBUG if debug else logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.DEBUG if debug else logging.INFO)
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d): %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        handler.addFilter(SensitiveFilter())
        logger.addHandler(handler)

    return logger


logger = setup_logging()
