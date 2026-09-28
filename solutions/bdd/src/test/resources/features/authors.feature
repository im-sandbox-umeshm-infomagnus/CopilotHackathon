Feature: Manage authors
  As a user
  I want to manage authors through the REST API
  So that author information can be created, viewed, updated, and deleted

  Scenario: Create an author
    When I create an author named "Ursula Le Guin"
    Then the response status is 200
    And the response contains an author named "Ursula Le Guin" with an id

  Scenario: Retrieve all authors
    Given an author named "Octavia Butler" exists
    When I retrieve all authors
    Then the response status is 200
    And the author list contains "Octavia Butler"

  Scenario: Retrieve an author by id
    Given an author named "Terry Pratchett" exists
    When I retrieve that author
    Then the response status is 200
    And the response contains an author named "Terry Pratchett" with an id

  Scenario: Update an author
    Given an author named "Old Name" exists
    When I update that author to be named "New Name"
    Then the response status is 200
    And the response contains an author named "New Name" with an id

  Scenario: Delete an author
    Given an author named "Delete Me" exists
    When I delete that author
    Then the response status is 200
    And the response body is empty
    When I retrieve the deleted author
    Then the response status is 404

  Scenario: Retrieve an author that does not exist
    When I retrieve an author with an unknown id
    Then the response status is 404

  Scenario: Update an author that does not exist
    When I update an author with an unknown id to be named "Missing"
    Then the response status is 404

  Scenario: Delete an author that does not exist
    When I delete an author with an unknown id
    Then the response status is 404