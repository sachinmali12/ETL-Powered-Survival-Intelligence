from sklearn.base import BaseEstimator, TransformerMixin

class FeatureEngineer(BaseEstimator, TransformerMixin):

    def fit(self, X, y=None):
        return self

    def transform(self, X):

        X = X.copy()

        # Family Size
        X["family_size"] = X["sibsp"] + X["parch"] + 1

        # Is Alone
        X["is_alone"] = (X["family_size"] == 1).astype(int)

        return X