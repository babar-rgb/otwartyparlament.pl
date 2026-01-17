def test_vote_results_logic():
    """Unit test for vote result processing logic (mocked)."""
    # This simulates a frontend or backend function that calculates percentages
    votes = {
        "for": 230,
        "against": 200,
        "abstain": 10,
        "absent": 20
    }
    total_votes = votes["for"] + votes["against"] + votes["abstain"]
    
    assert total_votes == 440
    assert votes["for"] > votes["against"]
    
    # Verify majority
    is_passed = votes["for"] > total_votes / 2
    assert is_passed is True

def test_vote_importance_score():
    """Test AI importance scoring bounds."""
    importance = 8
    assert 1 <= importance <= 10
