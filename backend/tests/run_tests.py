"""
Lightweight Test Runner for The Lenny Growth Assistant.
Executes all test suites and prints structured test results.
Works with both native Python and pytest.
"""

import sys
import os
import asyncio

# Setup module path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tests.test_skills import (
    test_ship30_prompt_structure,
    test_ship30_prompt_empty_chunks,
    test_extract_html_artifact,
    test_extract_markdown_artifact,
    test_strip_artifact_tags,
)
from tests.test_providers import (
    test_provider_factory_routing,
    test_mock_provider_streaming,
    test_mock_provider_out_of_domain_refusal,
    test_mock_provider_artifact_generation,
)
from tests.test_retrieval import (
    test_embedding_dimensions,
    test_out_of_domain_retrieval_rejection,
    test_in_domain_retrieval_success,
)
from tests.test_api import (
    test_chat_request_validation,
    test_session_create_default_title,
    test_session_create_custom_title,
    test_session_model_persistence_structure,
)

async def run_all_tests():
    passed = 0
    failed = 0
    
    sync_tests = [
        ("test_ship30_prompt_structure", test_ship30_prompt_structure),
        ("test_ship30_prompt_empty_chunks", test_ship30_prompt_empty_chunks),
        ("test_extract_html_artifact", test_extract_html_artifact),
        ("test_extract_markdown_artifact", test_extract_markdown_artifact),
        ("test_strip_artifact_tags", test_strip_artifact_tags),
        ("test_chat_request_validation", test_chat_request_validation),
        ("test_session_create_default_title", test_session_create_default_title),
        ("test_session_create_custom_title", test_session_create_custom_title),
        ("test_session_model_persistence_structure", test_session_model_persistence_structure),
    ]

    async_tests = [
        ("test_provider_factory_routing", test_provider_factory_routing),
        ("test_mock_provider_streaming", test_mock_provider_streaming),
        ("test_mock_provider_out_of_domain_refusal", test_mock_provider_out_of_domain_refusal),
        ("test_mock_provider_artifact_generation", test_mock_provider_artifact_generation),
        ("test_embedding_dimensions", test_embedding_dimensions),
        ("test_out_of_domain_retrieval_rejection", test_out_of_domain_retrieval_rejection),
        ("test_in_domain_retrieval_success", test_in_domain_retrieval_success),
    ]

    print("=" * 60)
    print("RUNNING AUTOMATED TEST SUITE: The Lenny Growth Assistant")
    print("=" * 60)

    for name, fn in sync_tests:
        try:
            fn()
            print(f"[PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"[FAIL] {name}: {e}")
            failed += 1

    for name, fn in async_tests:
        try:
            await fn()
            print(f"[PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"[FAIL] {name}: {e}")
            failed += 1

    print("=" * 60)
    print(f"RESULTS: {passed} PASSED, {failed} FAILED (Total: {passed + failed})")
    print("=" * 60)

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_all_tests())
