---
slug: java11-negative-symbol-swedish
heroImage: ../../assets/img/posts/java11-negative-sv/featured-image.jpg
category: java
description: >-
  We performed a migration to Java 11 and a bug fix about negative symbol for
  negative numbers in Java ruined our implementation. This article describes the
  situation and the lessons learned.
pubDate: 2021-05-06T00:00:00.000Z
tags:
  - java
  - java11
  - testing
title: Java 11 negative symbol in Swedish
---

We performed a migration to Java 11 and a bug fix about negative symbol for negative numbers in Java ruined our implementation. This article describes the situation and the lessons learned.

In the middle of a migration of a project to Java 11 a very curious scenario has appeared. We face a bug while dealing with negative numbers. We have a function to convert a positive number to negative. The implementation was working fine for Java 8 but not for Java 11:

```java
public String negativeNumber(int number) {
    return "-" + number;
}
```

The error appeared while trying to parse the numbers generated with that function:

```java
public Number parse(String number) throws ParseException {
    return fmt.parse(number)
}
```

More precisely, it was throwing the following exception:

```
Unparseable number: "-1"
java.text.ParseException: Unparseable number: "-1"
	at java.base/java.text.NumberFormat.parse(NumberFormat.java:431)
	at SwedishNegativeSymbol.shouldParseNegativeNumberButFailsOnJava11(SwedishNegativeSymbol.java:23)
```

The investigation and debug led us to compare our negative symbol with the one expected by the `NumberFormat`:

```java
@Test
public void shouldUseSameNegativeSymbol() {
    String expectedNegativeSymbol = fmt.getNegativePrefix();
    String negativeSymbol = negate(1).substring(0, 1);
    assertEquals("Negative symbols do not match!", expectedNegativeSymbol, negativeSymbol);
}
```

And... surprise, the test pass on Java 8 but not in Java 11:

```
Negative symbols do not match! expected:<[−]> but was:<[-]>
Expected :−
Actual   :-

org.junit.ComparisonFailure: Negative symbols do not match! expected:<[−]> but was:<[-]>
	at org.junit.Assert.assertEquals(Assert.java:115)
	at SwedishNegativeSymbol.shouldUseSameNegativeSymbol(SwedishNegativeSymbol.java:35)
```

<b>WTF!</b>. Why on earth the negative symbol do not match? The response is here: <a href="https://bugs.openjdk.java.net/browse/JDK-8214926">JDK-8214926</a>.

It looks like the negative symbol returned in Java 8 was wrong and Java authors decided to fix that in Java11. The two characters are visually very similar:

- − <a href="https://unicode-table.com/en/2212/">Minus-sign</a>
- \- <a href="https://unicode-table.com/en/002D/">Hyphen-minus</a>

The solution was straightforward: use the negative symbol provided by NumberFormat

```java
public String negativeNumberWorkingOnJava11(int number) {
    DecimalFormat fmt = (DecimalFormat) NumberFormat.getInstance(Locale.forLanguageTag("se-sv"));
    return fmt.getNegativePrefix() + number;
}
```

Now the test passes both in Java 8 and Java 11.

The lesson learned was important: <b>DO NOT HARDCODE NEGATIVE SYMBOL!</b>

You can find the source code here: <a href="https://github.com/adriangalera/java-sandbox/blob/master../../test/java/SwedishNegativeSymbol.java">SwedishNegativeSymbol.java</a>
