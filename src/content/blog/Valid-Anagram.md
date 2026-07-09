---
slug: coding-interview-prep/valid-anagram
heroImage: ../../assets/img/posts/valid-anagram/pexels-pixabay-278890.jpg
category: development
description: >-
  A walkthrough of "Valid Anagram": why sorting two strings works but isn't
  the cheapest option, and how a character frequency count gets you to
  linear time with constant extra space.
pubDate: 2026-06-04T00:00:00.000Z
draft: false
tags:
  - leetcode
  - algorithms
  - java
  - hashmap
  - interview
title: Valid Anagram - counting characters instead of sorting them
---

Next up in my [running log of coding interview problems](https://github.com/adriangalera/leet) from the Grind 75 / Neetcode Blind 75 plans: "Valid Anagram". It sits right after "Contains Duplicate" in the hashing section, and it's a good problem for noticing when a general-purpose tool (sorting) is overkill compared to a more specific one (counting).

## The problem

> Given two strings `s` and `t`, return `true` if the two strings are anagrams of each other, otherwise return `false`.

An anagram contains exactly the same characters as another string, just in a different order.

Full statement on [neetcode.io](https://neetcode.io/problems/is-anagram/question).

```text
Input: s = "anagram", t = "nagaram"
Output: true

Input: s = "rat", t = "car"
Output: false
```

Before writing any code, there's a cheap early exit worth stating up front: two strings with different lengths can never be anagrams of each other, since an anagram is a rearrangement, not a subset. Every approach below can bail out immediately if `s.length() != t.length()`.

## Sorting both strings

The most direct way to compare "do these two strings contain the same characters" is to put both sets of characters into a canonical order and then compare them directly:

```java
public boolean isAnagramSorting(String s, String t) {
    if (s.length() != t.length()) {
        return false;
    }
    char[] sChars = s.toCharArray();
    char[] tChars = t.toCharArray();
    Arrays.sort(sChars);
    Arrays.sort(tChars);
    return Arrays.equals(sChars, tChars);
}
```

If `s` and `t` are anagrams, sorting their characters produces two identical arrays — order was the only thing that differed, and sorting removes order from the equation. This works, and it's easy to read, but it costs **O(s log s + t log t)** time for the two sorts (which collapses to O(n log n) once you know the lengths are equal), plus **O(n)** space for the two character arrays the sort needs to work on. We're paying for a full ordering when all we actually need to know is "same characters, same counts" — order was never part of the question.

## The optimal approach: count character frequencies

Sorting establishes an ordering we don't care about. What actually defines an anagram is that every character appears the same number of times in both strings. A frequency map captures exactly that, without needing to know anything about relative order:

```java
public boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) {
        return false;
    }
    int[] counts = new int[26];
    for (int i = 0; i < s.length(); i++) {
        counts[s.charAt(i) - 'a']++;
        counts[t.charAt(i) - 'a']--;
    }
    for (int count : counts) {
        if (count != 0) {
            return false;
        }
    }
    return true;
}
```

One pass over both strings simultaneously increments the count for each character seen in `s` and decrements it for the same-position character in `t`. If `s` and `t` are true anagrams, every increment from `s` is eventually cancelled out by a matching decrement from `t`, so every slot in `counts` lands back on zero. Any nonzero slot means some character showed up a different number of times in one string than the other, which is disqualifying regardless of order.

### Why this is O(n)

The first loop walks both strings exactly once — **O(n)** where n is their shared length. The second loop always checks exactly 26 slots, a fixed number that doesn't grow with the input, so it's **O(1)**, not O(n). Total time is **O(n)**, strictly better than the O(n log n) sorting needs. Space is **O(1)** too: `counts` is a fixed-size array of 26 integers no matter how long `s` and `t` are, unlike the sorted copies the previous approach had to allocate.

The `int[26]` trick only works cleanly because the problem allows you to assume lowercase English letters. If the input could contain arbitrary Unicode, you'd swap the array for a `HashMap<Character, Integer>` and get the same O(n) time with O(k) space, where k is the number of distinct characters actually seen — still bounded and still a lot cheaper than sorting.

## Takeaway

When a problem is really asking "do these two collections have the same _multiset_ of elements", resist the urge to reach for sorting just because it makes equality checks convenient — sorting is solving a more general problem (order) than the one you were asked (counts). A frequency count, backed by a fixed-size array when the alphabet is bounded or a hash map when it isn't, gets you there in linear time and constant or near-constant space. It's the same instinct as reaching for a hash set in "Contains Duplicate": when the question reduces to counting or membership, hashing (or a bounded array standing in for one) beats any approach that first imposes an ordering you don't need.
