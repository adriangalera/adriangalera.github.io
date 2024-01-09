---
slug: java-test-utf8
heroImage: /src/assets/img/posts/java-utf8/featured.jpg
category: java
description: >-
  We have experienced an issue with UTF-8 characters in Java and we have
  designed a unit test to prevent that to happen again.
pubDate: 2020-11-20T00:00:00.000Z
tags:
  - java
  - unit-test
  - utf8
  - i18n
title: Java Unit Test to check UTF-8 chars
---

During a migration to a new plattform, we have detected an issue with the character encoding. Some of the messages contained the UTF-8 replacement character (�)

Fortunately, we have been able to fix the configuration issue and to make sure it does not happen again we have put in place a variation of the following unit test:

```java
import org.junit.Assert;
import org.junit.Test;

public class CheckUtf8ReplacementChar {


    private boolean containsUtf8ReplacementCharacter(String target) {
        final int REPLACEMENT_CHARACTER_VALUE = 65533;
        for (int i = 0; i < target.length(); i++) {
            if ((int) target.charAt(i) == REPLACEMENT_CHARACTER_VALUE) {
                return true;
            }
        }
        return false;
    }

    @Test
    public void shouldDetectUtf8ReplacementChar() {
        final String wrongString = "Wrong characters ������������������<br>";
        final String okString = "OK characters";
        Assert.assertTrue(containsUtf8ReplacementCharacter(wrongString));
        Assert.assertFalse(containsUtf8ReplacementCharacter(okString));
    }
}
```

Even though this can be improved, we didn't have much time to think about it. That's the first way we could develop.
