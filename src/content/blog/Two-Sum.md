---
slug: coding-interview-prep/two-sum
heroImage: ../../assets/img/posts/two-sum/pexels-pixabay-534216.jpg
category: development
description: >-
  A walkthrough of "Two Sum": why checking every pair is wasteful, and how
  reframing the problem around a complement value lets a single HashMap pass
  find the answer in linear time.
pubDate: 2026-06-04T00:00:00.000Z
draft: false
tags:
  - leetcode
  - algorithms
  - java
  - hashmap
  - interview
title: Two Sum - the complement trick that everyone eventually reaches for
---

"Two Sum" shows up early in pretty much every version of these study plans, and it's in my own [running log of coding interview problems](https://github.com/adriangalera/leet) too, right after Contains Duplicate and Valid Anagram. It looks trivial the first time you read it, but the way you get from the obvious O(n²) solution to the O(n) one is a pattern that reappears constantly once you learn to spot it.

## The problem

> Given an array of integers `nums` and an integer `target`, return the indices `i` and `j` such that `nums[i] + nums[j] == target` and `i != j`. You may assume exactly one valid pair exists. Return the smaller index first.

Full statement on [neetcode.io](https://neetcode.io/problems/two-integer-sum/question).

```text
Input: nums = [3, 4, 5, 6], target = 7
Output: [0, 1]  // nums[0] + nums[1] == 3 + 4 == 7

Input: nums = [4, 5, 6], target = 10
Output: [0, 2]  // nums[0] + nums[2] == 4 + 6 == 10
```

There's exactly one answer to find, and the problem guarantees it exists, so there's no need to handle "no pair found" — that constraint is worth keeping in mind because it's what makes the optimized approach so clean.

## Brute force: try every pair

The most direct translation of the problem statement is two nested loops that try every combination of indices until one sums to `target`:

```java
public int[] twoSumBruteForce(int[] nums, int target) {
    for (int i = 0; i < nums.length; i++) {
        for (int j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] == target) {
                return new int[] { i, j };
            }
        }
    }
    throw new IllegalArgumentException("No valid pair found");
}
```

Starting `j` at `i + 1` avoids pairing an element with itself and avoids checking the same pair twice, but in the worst case — the matching pair sits at the very end of the array — we still examine close to n²/2 combinations. That's **O(n²)** time. Space is **O(1)**: we only ever hold a couple of loop indices, nothing that scales with the input.

## The optimized approach: store complements in a HashMap

The brute force loop spends most of its time asking "does some other element, paired with this one, hit the target?" one pair at a time. But for any `nums[i]`, there's only one value that could possibly complete the pair: `target - nums[i]`. Call that the **complement**. The question "have I already seen this complement?" is exactly what a hash map answers in O(1), so instead of searching the rest of the array for it, we can look it up.

That reframing lets us solve the problem in a single pass: for each element, first check whether its complement is already in the map (meaning some earlier element completes the pair with it), and only if not, record the current element for a _later_ element to find:

```java
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>(); // value -> index
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (seen.containsKey(complement)) {
            return new int[] { seen.get(complement), i };
        }
        seen.put(nums[i], i);
    }
    throw new IllegalArgumentException("No valid pair found");
}
```

Checking the map _before_ inserting the current element matters for two reasons. First, it's what naturally returns the smaller index first — the earlier element is always already in the map by the time we find its partner. Second, it correctly handles a target that's double some value in the array (e.g. `nums = [3, 3]`, `target = 6`): if we inserted before checking, the first `3` could accidentally "find itself" as its own complement.

### Why this is O(n)

We walk the array exactly once, and at each step we do a constant amount of work: one arithmetic subtraction, one `containsKey` lookup, and possibly one `put`. Both `HashMap` operations are **O(1) on average**, because the map hashes the key directly to a bucket instead of scanning existing entries — the cost doesn't grow with how many entries are already stored. One pass of O(1) steps gives **O(n)** total time, down from the O(n²) of comparing every pair.

Space is **O(n)** in the worst case, because we might insert every element into the map before finally hitting the one that completes the pair — that happens whenever the matching element sits near the end of the array. We've traded that extra memory for not having to re-scan the array at every step, which is the same trade-off you'll see again in Contains Duplicate and Valid Anagram.

## Takeaway

Whenever a brute-force solution boils down to "for this element, search the rest of the array for some specific related value," ask what that related value actually is — a complement, a target minus the current value, a character you're expecting to close a bracket — and store _that_ in a hash map as you go. It turns an O(n²) search into an O(n) single pass, at the cost of O(n) space, and it's the same trick underneath a surprising number of "find a pair/group that satisfies X" problems.
