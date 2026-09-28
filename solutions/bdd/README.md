# BDD Author API Solution

This project contains a Cucumber/Gherkin integration test suite for the Author REST API. Its scenarios cover creating an author, listing and retrieving authors, updating and deleting an author, and 404 responses for operations on unknown authors.

## Run the tests

Requires Java 17. From this directory, run:

```sh
./mvnw test
```

On Windows, run:

```bat
mvnw.cmd test
```

The feature file is `src/test/resources/features/authors.feature`; its HTTP steps are implemented in `src/test/java/com/microsoft/hackathon/demo/steps/AuthorSteps.java`.
