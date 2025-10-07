---
heroImage: '../../assets/img/posts/sms-spam/ChatGPT Image Oct 7, 2025, 01_11_28 AM.png'
category: machine learning
description: >-
  Ever wondered how AI can filter out those annoying spam SMS? In this post, I
  explore how machine learning models are trained to detect spam SMS using
  real-world techniques
pubDate: 2025-10-06T00:00:00.000Z
draft: false
tags:
  - sms
  - python
  - ml
title: Using maching learning to fight SMS spam
---

While reviewing the contents of [Hack the box Academy](https://academy.hackthebox.com/ 'HackTheBox academy') I stumbled upon a course about using AI in infosec tasks. I'll write a series of articles about what I learnt there.

This is the first one and it is about using machine learning (a subfield of AI) to write a filter that classifies SMS as normal or as spam depending on the content. This article highlights the the different stages on a machine learning pipeline.

There are some specific details about natural language processing in the feature extraction and dataset preparation; every application of machine learning will have its own intricacies.

## Getting the dataset

I'll use a [dataset](https://archive.ics.uci.edu/static/public/228/sms+spam+collection.zip 'dataset') coming from the combined efforts of Tiago A. Almeida and Akebo Yamakami at the School of Electrical and Computer Engineering at the University of Campinas in Brazil, and José María Gómez Hidalgo at the R\&D Department of Optenet in Spain. The following code will download the dataset, unzipped and check what's in the extracted folder:

```python
import requests
import zipfile
import io
import os

# URL of the dataset
url = "https://archive.ics.uci.edu/static/public/228/sms+spam+collection.zip"
# Download the dataset
response = requests.get(url)
if response.status_code == 200:
    print("Download successful")
else:
    print("Failed to download the dataset")

# Extract the dataset
with zipfile.ZipFile(io.BytesIO(response.content)) as z:
    z.extractall("sms_spam_collection")
    print("Extraction successful")

# List the extracted files
extracted_files = os.listdir("sms_spam_collection")
print("Extracted files:", extracted_files)
```

## Exploratory Dataset Analysis

Once we have the dataset, usually it is a good idea to explore it to see how the data looks like, and observe some statistical properties such as average, max, min values. It is also important to spot some missing and duplicated data (and remove it if required)

```python
import pandas as pd

# Load the dataset
df = pd.read_csv(
    "sms_spam_collection/SMSSpamCollection",
    sep="\t",
    header=None,
    names=["label", "message"],
)
# Display basic information about the dataset
print("-------------------- HEAD --------------------")
print(df.head())
print("-------------------- DESCRIBE --------------------")
print(df.describe())
print("-------------------- INFO --------------------")
print(df.info())

# Check for missing values
print("Missing values:\n", df.isnull().sum())

# Check for duplicates
print("Duplicate entries:", df.duplicated().sum())

# Remove duplicates if any
df = df.drop_duplicates()
```

Now the data is clean, but its format does not allow further processing by any ML algorithm. At this point, we need to prepare the data to extract features that we can pass to the machine learning model.

## Data preparation

Here the data will be modified according to some specific transformations related with natural language processing.

### Lowercase

The relevance of casing is irrelevant to the problem. We can reduce the dimension of casing by having the text only in lowercase:

```python
# Preprocessing the text
import nltk

# Download the necessary NLTK data files
nltk.download("punkt")
nltk.download("punkt_tab")
nltk.download("stopwords")

print("=== BEFORE ANY PREPROCESSING ===")
print(df.head(5))

# Convert all message text to lowercase
df["message"] = df["message"].str.lower()
print("\n=== AFTER LOWERCASING ===")
print(df["message"].head(5))
```

### Remove punctuation symbols

Similar to casing, the fact that a message contains commas or point, etc, it is irrelevant to detect if the SMS is spam or not.

However, there are some special symbols that we want to keep. Usually spam campaigns are used to lure people into cons or something that has to do with money, so we really want to have the dollar symbol `$` in our dataset. The following code with regex remove any non letter character or `$` or `!`:

```python
import re

# Remove non-essential punctuation and numbers, keep useful symbols like $ and !
df["message"] = df["message"].apply(lambda x: re.sub(r"[^a-z\s$!]", "", x))
print("\n=== AFTER REMOVING PUNCTUATION & NUMBERS (except $ and !) ===")
print(df["message"].head(5))
```

### Tokenization

In order to continue preparing the dataset, we need to treat each message as an array instead of string. We split each message by using words to create the array. This process is called tokenization.

```python

from nltk.tokenize import word_tokenize

# Split each message into individual tokens
df["message"] = df["message"].apply(word_tokenize)
print("\n=== AFTER TOKENIZATION ===")
print(df["message"].head(5))
```

The data will change from:

```
0    go until jurong point crazy available only in ...
```

to:

```
0   [go, until, jurong, point, crazy, available, o...]
```

### Remove stop words

There are some common connectors will not contribute to the model. These are stop words such as the, and, etc... The following code uses nltk library to remove them from the text and only keep relevant words:

```python
from nltk.corpus import stopwords

# Define a set of English stop words and remove them from the tokens
stop_words = set(stopwords.words("english"))
df["message"] = df["message"].apply(lambda x: [word for word in x if word not in stop_words])
print("\n=== AFTER REMOVING STOP WORDS ===")
print(df["message"].head(5))
```

### Stemming

We can join similar words that have the same meaning, but they use different tenses. For example, `run` and `running` will have a similar meaning, therefore, we can only keep `run` in the dataset. This way the dataset size can be reduced and the model will be able to work more efficiently.

```python
from nltk.stem import PorterStemmer

# Stem each token to reduce words to their base form
stemmer = PorterStemmer()
df["message"] = df["message"].apply(lambda x: [stemmer.stem(word) for word in x])
print("\n=== AFTER STEMMING ===")
print(df["message"].head(5))
```

### Back to string

When all the dataset preparation is done, we can revert the message to string to extract the features in the next stage:

```python
# Rejoin tokens into a single string for feature extraction
df["message"] = df["message"].apply(lambda x: " ".join(x))
print("\n=== AFTER JOINING TOKENS BACK INTO STRINGS ===")
print(df["message"].head(5))
```

## Feature extraction

Machine learning algorithms do not understand anything about words or message or strings. Instead, they use algebra or statistics to detect (or learn) the underlying patterns in the data. So, we need to transform our dataset of messages into some meaningful features for the model.

In this case, a good feature extractor is to capture a bag of words. This is done by processing all the remaining words in the dataset and create an array of 0 and 1s. Each position represents a word in the bag, if the value of the array position is 1, it means the word is present in the message, otherwise the value is 0.

We can refine this behavior by considering not only 1 word ( called `unigram`), but a combination of two words, called `bigram`. By combining `unigrams` and `bigrams` in the matrix, the model will capture more complex relationships between words.

Furthermore, we should exclude terms with very few occurrences (will contribute to overfitting) or terms with too much occurrences (will only create noise because the information they provide is very small).

```python
from sklearn.feature_extraction.text import CountVectorizer

# Initialize CountVectorizer with bigrams, min_df, and max_df to focus on relevant terms
# min_df = 1: A term must appear in at least one document to be included.
# max_df = 0.9: Terms that appear in more than 90 % of the documents are excluded, removing common words that provide not mucch differentiation.
# ngram_range = (1, 2): The feature matrix captures individual words and common word pairs by including unigrams and bigrams
vectorizer = CountVectorizer(min_df = 1, max_df = 0.9, ngram_range = (1, 2))

# Fit and transform the message column
X = vectorizer.fit_transform(df["message"])

# Labels(target variable)
y = df["label"].apply(lambda x: 1 if x == "spam" else 0)  # Converting labels to 1 and 0
```

Similarly, the labels `spam` or `ham` will be converted to 1 or 0.

## Training the model

The features now should be passed to the model to run the training phase and learn the patterns of the dataset. The chosen model is `Multinomial Naive Baytes`. This model accepts an hyperparameter called `alpha` which controls how the model handles unseen data and prevents the probabilities to be zero.

To determine the optimal value of alpha, we can train different values and get the one that outputs better performance. To measure the performance, we can rely on the `F1 score` which combines precision and recall.

```python
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

# Build the pipeline by combining vectorization and classification
pipeline = Pipeline([
  ("vectorizer", vectorizer),
  ("classifier", MultinomialNB())
])

# Use GridSearchCV to try out different hyperparameter(alpha) on the classifier and get the one with better results.
# Perform the grid search with 5-fold cross-validation and the F1-score as metric
# Define the parameter grid for hyperparameter tuning
param_grid = {
    "classifier__alpha": [0.01, 0.1, 0.15, 0.2, 0.25, 0.5, 0.75, 1.0]
  }

grid_search = GridSearchCV(
    pipeline,
    param_grid,
    cv = 5,
    scoring = "f1"

  )

# Fit the grid search on the full dataset
grid_search.fit(df["message"], y)

# Extract the best model identified by the grid search
best_model = grid_search.best_estimator_
print("Best model parameters:", grid_search.best_params_)
```

`GridSeachCV` stands for grid search cross validation. `cv = 5` implies that the algorithm will split the dataset into five parts, four will be used to train the model and one to test. This process is repeated so that each part of the dataset is used once for testing.

## Predicting real world messages

At this point, the model is trained. We need to explore how the model generalizes for real world messages. To do so, we need to transform the messages to the same features the model expect and tell the model to predict the labels:

```python
# Example SMS messages for evaluation
new_messages = [
    "Congratulations! You've won a $1000 Walmart gift card. Go to http://bit.ly/1234 to claim now.",
    "Hey, are we still meeting up for lunch today?",
    "Urgent! Your account has been compromised. Verify your details here: www.fakebank.com/verify",
    "Reminder: Your appointment is scheduled for tomorrow at 10am.",
    "FREE entry in a weekly competition to win an iPad. Just text WIN to 80085 now!",
  ]

import numpy as np
import re

# Preprocess function that mirrors the training-time preprocessing
def preprocess_message(message):
    message = message.lower()
    message = re.sub(r"[^a-z\s$!]", "", message)
    tokens = word_tokenize(message)
    tokens = [word for word in tokens if word not in stop_words]
    tokens = [stemmer.stem(word) for word in tokens]
    return " ".join(tokens)

# Preprocess and vectorize messages
processed_messages = [preprocess_message(msg) for msg in new_messages]

# Transform preprocessed messages into feature vectors
X_new = best_model.named_steps["vectorizer"].transform(processed_messages)

# Predict with the trained classifier
predictions = best_model.named_steps["classifier"].predict(X_new)
prediction_probabilities = best_model.named_steps["classifier"].predict_proba(X_new)

# Display predictions and probabilities for each evaluated message
for i, msg in enumerate(new_messages):
    prediction = "Spam" if predictions[i] == 1 else "Not-Spam"
    spam_probability = prediction_probabilities[i][1]  # Probability of being spam
    ham_probability = prediction_probabilities[i][0]   # Probability of being not spam

    print(f"Message: {msg}")
    print(f"Prediction: {prediction}")
    print(f"Spam Probability: {spam_probability:.2f}")
    print(f"Not-Spam Probability: {ham_probability:.2f}")
    print("-" * 50)

```

Once the results are satisfactory, the model can be persisted using `joblib`:

```python
import joblib

# Save the trained model to a file for future use
model_filename = 'spam_detection_model.joblib'
joblib.dump(best_model, model_filename)

print(f"Model saved to {model_filename}")
```
