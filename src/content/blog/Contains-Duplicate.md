---
slug: coding-interview-prep/contains-duplicate
heroImage: ../../assets/img/posts/contains-duplicate/featured.svg
category: development
description: >-
  A deeper look at "Contains Duplicate": why the brute force and sorting
  approaches fall short, how a hash set gets you to linear time, and when a
  plain boolean array beats hashing altogether.
pubDate: 2026-06-04T00:00:00.000Z
draft: false
tags:
  - leetcode
  - algorithms
  - java
  - hashset
  - interview
title: Contains Duplicate - a classic hashing warm-up
---

"Contains Duplicate" is one of the first entries in my [running log of coding interview problems](https://github.com/adriangalera/leet), which I keep while working through the [Grind 75](https://www.techinterviewhandbook.org/grind75/) and [Neetcode Blind 75](https://neetcode.io/practice/practice/blind75) study plans. It's a five-minute problem on paper, but it's worth slowing down on because the reasoning behind picking a hash set over sorting (or over sorting over brute force) is a template you'll reuse constantly.

## The problem

> Given an integer array `nums`, return `true` if any value appears more than once in the array, otherwise return `false`.

Full statement on [neetcode.io](https://neetcode.io/problems/duplicate-integer/question).

```text
Input: nums = [1, 2, 3, 3]
Output: true

Input: nums = [1, 2, 3, 4]
Output: false
```

There's no target index to return, no ordering to preserve — just a yes/no answer. That simplicity is what makes it a good vehicle for comparing approaches side by side.

## Brute force: check every pair

The most literal reading of the problem is "for every element, look at every other element and see if any of them match":

```java
public boolean containsDuplicateBruteForce(int[] nums) {
    for (int i = 0; i < nums.length; i++) {
        for (int j = i + 1; j < nums.length; j++) {
            if (nums[i] == nums[j]) {
                return true;
            }
        }
    }
    return false;
}
```

The inner loop starts at `i + 1` so we never compare an element with itself and never check the same pair twice, but we still do roughly n²/2 comparisons in the worst case (an array with no duplicates at all, so both loops run to completion). That's **O(n²)** time. The only thing going for it is **O(1)** extra space — it reads directly from the input array and needs no auxiliary structure. Fine for a handful of elements, unusable once `nums` grows past a few thousand entries.

## Sorting first

If we sort the array, any duplicate values are guaranteed to end up adjacent to each other, so a single linear pass over the sorted array is enough to catch them:

```java
public boolean containsDuplicateSorting(int[] nums) {
    Arrays.sort(nums);
    for (int i = 1; i < nums.length; i++) {
        if (nums[i] == nums[i - 1]) {
            return true;
        }
    }
    return false;
}
```

This drops the time complexity to **O(n log n)** — the sort dominates, since the follow-up scan is only O(n) — and space stays **O(1)** if we don't count what `Arrays.sort` uses internally for primitives (it's an in-place dual-pivot quicksort for `int[]`). The catch is that it mutates the input array. If the caller still needs the original order afterwards, this approach silently breaks their code, which is a real cost even though it doesn't show up in the Big-O.

## The optimal approach: a hash set

Sorting is doing more work than the problem actually asks for — we don't care about _order_, only about whether we've _seen a value before_. That's exactly the question a set answers, and it answers it without needing to sort anything first.

Java's `HashSet.add()` already returns `false` when the element you're inserting is already present, so there's no need to `contains()` then `add()` separately — one call gives you both pieces of information:

```java
public boolean containsDuplicate(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int num : nums) {
        if (!seen.add(num)) {
            return true;
        }
    }
    return false;
}
```

We walk the array once. For each value, we try to add it to `seen`. If `add()` comes back `false`, that value was already in the set, so we've found our duplicate and can return immediately without looking at the rest of the array. If we make it to the end without a failed insert, every value was unique.

### Why this is O(n)

A `HashSet` bucket-indexes elements by their hash code, so insertion and lookup are **O(1) on average** — computing `hashCode()` and jumping to a bucket doesn't depend on how many elements are already stored. Across the whole array that gives **O(n)** total time, down from O(n log n) or O(n²).

"On average" matters here: if many values hash into the same bucket (a bad hash function, or an adversarial input), a single `add()` degrades toward O(n) and the whole loop toward O(n²) in the worst case. `Integer.hashCode()` is just the int value itself, which spreads well across buckets for typical inputs, so in practice you get the average case, not the pathological one.

Space is **O(n)** in the worst case: an array with no duplicates forces us to store every single element in the set before we can conclude there's no match.

## An even cheaper option, when it applies

If you know `nums` only contains values in a small, bounded range (say, 0–255, or ages, or anything with a known ceiling), you don't need a hash function at all — a plain `boolean[]` indexed directly by value does the same job with no hashing overhead:

```java
public boolean containsDuplicateBoundedRange(int[] nums, int maxValue) {
    boolean[] seen = new boolean[maxValue + 1];
    for (int num : nums) {
        if (seen[num]) {
            return true;
        }
        seen[num] = true;
    }
    return false;
}
```

Complexity-wise this is still O(n) time and O(k) space, where k is the size of the value range rather than the input — but array indexing has no collision handling and no boxing (no `Integer` autoboxing, unlike `HashSet<Integer>`), so it's meaningfully faster in practice. This only works when the range is known and reasonably small; for arbitrary `int` values it's obviously off the table.

## Takeaway

Whenever a problem reduces to "have I seen this value before?", reach for a hash-based structure by default — it turns nested loops or a sort into a single linear pass, at the cost of O(n) extra memory. But don't stop there: if the values are bounded and known ahead of time, a plain array indexed by value beats hashing outright, because you skip the hash computation and collision handling entirely. Knowing _when_ the cheaper structure applies is as valuable as knowing the hash set trick itself.
