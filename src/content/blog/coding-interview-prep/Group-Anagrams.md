---
slug: coding-interview-prep/group-anagrams
heroImage: ../../../assets/img/posts/group-anagrams/pexels-suki-lee-15555328.jpg
category: development
description: >-
  A walkthrough of "Group Anagrams": why comparing every pair of strings is
  too slow, and how turning each word into a canonical hash-map key groups
  them all in linear time.
pubDate: 2026-06-04T00:00:00.000Z
draft: false
tags:
  - leetcode
  - algorithms
  - java
  - hashmap
  - interview
title: Group Anagrams - picking the right key for a hash map
---

Straight after "Valid Anagram" in my [running log of coding interview problems](https://github.com/adriangalera/leet) comes its natural sequel: instead of checking whether two strings are anagrams, you're asked to bucket an entire list of them by that relationship. It's a good problem for thinking about hash maps not just as lookup tables, but as a way to invent a key that captures exactly the property you care about.

## The problem

> Given an array of strings `strs`, group all anagrams together into sublists. You may return the output in any order.

An anagram contains the exact same characters as another string, just in a different order.

Full statement on [neetcode.io](https://neetcode.io/problems/anagram-groups/question).

```text
Input: strs = ["eat", "tea", "tan", "ate", "nat", "bat"]

Output: [["bat"], ["nat", "tan"], ["ate", "eat", "tea"]]
```

The order of the groups, and the order of strings within each group, doesn't matter — only the grouping itself is checked.

## Brute force: compare every string to every group

The most direct reading of the problem is "for each string, find a group it belongs in, or start a new one if none matches". That means comparing the current string against a representative of every group seen so far, using the same character-count check from "Valid Anagram":

```java
public List<List<String>> groupAnagramsBruteForce(String[] strs) {
    List<List<String>> groups = new ArrayList<>();
    for (String str : strs) {
        boolean placed = false;
        for (List<String> group : groups) {
            if (isAnagram(str, group.get(0))) {
                group.add(str);
                placed = true;
                break;
            }
        }
        if (!placed) {
            List<String> newGroup = new ArrayList<>();
            newGroup.add(str);
            groups.add(newGroup);
        }
    }
    return groups;
}

private boolean isAnagram(String s, String t) {
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

For every one of the n strings, we potentially walk through every existing group and run an O(k) anagram check against it, where k is the average string length. In the worst case (no two strings are anagrams of each other, so every string starts its own group) that's O(n) groups to scan for each of the n strings, each comparison costing O(k) — **O(n² \* k)** overall. That quadratic factor in the number of strings is the part we need to get rid of.

## The optimal approach: a canonical key per string

The brute force approach is doing repeated work: it re-derives "are these two strings anagrams" from scratch for every pair. Anagrams share one thing that never changes no matter how you permute the characters — the frequency of each letter. If we compute that frequency once per string and use it as a hash map key, every anagram of a given word maps to the exact same key, and grouping becomes a single pass with O(1) lookups instead of a scan:

```java
public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> groups = new HashMap<>();
    for (String str : strs) {
        int[] counts = new int[26];
        for (char c : str.toCharArray()) {
            counts[c - 'a']++;
        }
        String key = Arrays.toString(counts);
        groups.computeIfAbsent(key, k -> new ArrayList<>()).add(str);
    }
    return new ArrayList<>(groups.values());
}
```

For each string we build a fixed-size array of 26 character counts and turn it into a string via `Arrays.toString` — that's the canonical key. Two strings are anagrams if and only if they produce the exact same count array, so `Arrays.toString` of that array is guaranteed to collide for anagrams and differ for anything else. `computeIfAbsent` either finds the existing list for that key or creates a fresh one, then appends the current string either way, so there's no separate "does this key exist" check needed.

### Why this is O(n \* k)

We iterate over all n strings once, and for each one we do O(k) work to build its 26-count array and O(k) work again to stringify it (both bounded by the string's length, k). That's **O(n \* k)** total time, with no quadratic term at all — the hash map gives us O(1) average-case lookup and insert per key, so growing the number of distinct groups doesn't cost anything extra the way scanning existing groups did in the brute force version.

Space is **O(n \* k)** too: in the worst case every string is unique, so the map ends up storing all n strings plus one 26-length key array per string, and both scale with the total characters across the input.

The `int[26]` key only works because the problem restricts input to lowercase English letters, exactly like in "Valid Anagram" — the fixed alphabet size is what keeps each key's construction to O(k) instead of something that depends on the character set. A cheaper alternative when strings are short is sorting each string's characters and using the sorted string itself as the key (`new String(chars).chars().sorted()...`), which costs O(k log k) per string instead of O(k) — usually a fine trade-off if you'd rather not build an explicit count array, but asymptotically worse for long strings.

## Takeaway

When a problem asks you to group items by some equivalence relation, look for a canonical form that's identical for every item in the same group and different across groups, then use that canonical form as a hash map key. It turns an O(n²) all-pairs comparison into a single O(n) pass, because the hash map is effectively doing the "are these the same group" check for you at insertion time, one item at a time, instead of you re-deriving it against every previously seen item.
