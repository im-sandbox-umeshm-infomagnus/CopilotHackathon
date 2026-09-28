package com.microsoft.hackathon.demo.steps;

import com.microsoft.hackathon.demo.repository.AuthorRepository;
import io.cucumber.java.Before;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.util.List;
import java.util.Map;
import org.junit.Assert;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

public class AuthorSteps {
    private static final String UNKNOWN_ID = "9223372036854775807";
    private static final ParameterizedTypeReference<Map<String, Object>> AUTHOR_TYPE =
            new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<List<Map<String, Object>>> AUTHORS_TYPE =
            new ParameterizedTypeReference<>() {};

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private AuthorRepository authorRepository;

    @LocalServerPort
    private int port;

    private ResponseEntity<?> response;
    private Map<String, Object> author;
    private List<Map<String, Object>> authors;
    private String authorId;

    @Before
    public void clearAuthors() {
        authorRepository.deleteAll();
        authorId = null;
    }

    @Given("an author named {string} exists")
    public void anAuthorExists(String name) {
        ResponseEntity<Map<String, Object>> created = sendAuthor(HttpMethod.POST, authorsUrl(), name);
        Assert.assertEquals(200, created.getStatusCode().value());
        authorId = created.getBody().get("id").toString();
    }

    @When("I create an author named {string}")
    public void createAuthor(String name) {
        response = sendAuthor(HttpMethod.POST, authorsUrl(), name);
        author = (Map<String, Object>) response.getBody();
    }

    @When("I retrieve all authors")
    public void retrieveAllAuthors() {
        ResponseEntity<List<Map<String, Object>>> result = restTemplate.exchange(
                authorsUrl(), HttpMethod.GET, null, AUTHORS_TYPE);
        response = result;
        authors = result.getBody();
    }

    @When("I retrieve that author")
    public void retrieveThatAuthor() {
        retrieveAuthor(authorId);
    }

    @When("I retrieve the deleted author")
    public void retrieveDeletedAuthor() {
        retrieveAuthor(authorId);
    }

    @When("I retrieve an author with an unknown id")
    public void retrieveUnknownAuthor() {
        retrieveAuthor(UNKNOWN_ID);
    }

    @When("I update that author to be named {string}")
    public void updateAuthor(String name) {
        response = sendAuthor(HttpMethod.PUT, authorsUrl() + "/" + authorId, name);
        author = (Map<String, Object>) response.getBody();
    }

    @When("I update an author with an unknown id to be named {string}")
    public void updateUnknownAuthor(String name) {
        response = sendAuthor(HttpMethod.PUT, authorsUrl() + "/" + UNKNOWN_ID, name);
    }

    @When("I delete that author")
    public void deleteAuthor() {
        response = restTemplate.exchange(
                authorsUrl() + "/" + authorId, HttpMethod.DELETE, null, Void.class);
    }

    @When("I delete an author with an unknown id")
    public void deleteUnknownAuthor() {
        response = restTemplate.exchange(
                authorsUrl() + "/" + UNKNOWN_ID, HttpMethod.DELETE, null, Void.class);
    }

    @Then("the response status is {int}")
    public void responseStatusIs(int status) {
        Assert.assertEquals(status, response.getStatusCode().value());
    }

    @And("the response contains an author named {string} with an id")
    public void responseContainsAuthor(String name) {
        Assert.assertNotNull(author);
        Assert.assertNotNull(author.get("id"));
        Assert.assertEquals(name, author.get("name"));
    }

    @And("the author list contains {string}")
    public void authorListContains(String name) {
        Assert.assertNotNull(authors);
        Assert.assertTrue(authors.stream().anyMatch(item -> name.equals(item.get("name"))));
    }

    @And("the response body is empty")
    public void responseBodyIsEmpty() {
        Assert.assertNull(response.getBody());
    }

    private void retrieveAuthor(String id) {
        ResponseEntity<Map<String, Object>> result = restTemplate.exchange(
                authorsUrl() + "/" + id, HttpMethod.GET, null, AUTHOR_TYPE);
        response = result;
        author = result.getBody();
    }

    private ResponseEntity<Map<String, Object>> sendAuthor(HttpMethod method, String url, String name) {
        HttpEntity<Map<String, String>> request = new HttpEntity<>(Map.of("name", name));
        return restTemplate.exchange(url, method, request, AUTHOR_TYPE);
    }

    private String authorsUrl() {
        return "http://localhost:" + port + "/authors";
    }
}